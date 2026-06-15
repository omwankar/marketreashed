/**
 * Shared server-side AI providers: Groq → Gemini → NVIDIA.
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "deepseek-r1-distill-llama-70b";
const GEMINI_MODEL = "gemini-2.0-flash";
const NVIDIA_MODELS = ["meta/llama-3.1-8b-instruct", "moonshotai/kimi-k2.6"];
const RETRYABLE = new Set([429, 502, 503, 504]);

function firstEnv(...names) {
  for (const name of names) {
    const v = process.env[name];
    if (v && String(v).trim()) return String(v).trim();
  }
  return "";
}

export function getKeys() {
  return {
    groq: firstEnv("GROQ_API_KEY", "VITE_GROQ_API_KEY", "GROQ_KEY"),
    gemini: firstEnv("VITE_GEMINI_API_KEY", "GEMINI_API_KEY", "GOOGLE_GEMINI_API_KEY"),
    nvidia: firstEnv("VITE_NVIDIA_API_KEY", "NVIDIA_API_KEY"),
  };
}

export function hasAnyKey(keys) {
  return (
    keys.groq?.startsWith("gsk_") ||
    keys.groq?.length >= 30 ||
    keys.gemini?.length >= 20 ||
    keys.nvidia?.startsWith("nvapi-")
  );
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function stripModelReasoning(text) {
  return String(text)
    .replace(/[\s\S]*?<\/think>/gi, "")
    .replace(/```json|```/g, "")
    .trim();
}

export function parseJsonFromText(text) {
  const cleaned = stripModelReasoning(text);
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Model response did not contain JSON");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function friendlyError(status, provider, rawText) {
  const t = String(rawText || "");
  if (status === 429 || t.includes("quota") || t.includes("RESOURCE_EXHAUSTED")) {
    return `${provider} rate limit — wait a minute or use another provider.`;
  }
  if (status === 504 || status === 502 || t.includes("deployment")) {
    return `${provider} timed out — trying next provider.`;
  }
  if (status === 401 || status === 403) {
    return `${provider} rejected the API key — check env vars and redeploy.`;
  }
  return `${provider} failed (${status})`;
}

function httpError(status, provider, bodyText) {
  const err = new Error(friendlyError(status, provider, bodyText));
  err.status = status;
  err.retryable = RETRYABLE.has(status);
  return err;
}

async function withRetry(fn, { attempts = 2, delays = [0, 1500] } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    if (delays[i]) await sleep(delays[i]);
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (!e.retryable || i === attempts - 1) throw e;
    }
  }
  throw lastErr;
}

async function callGroq(prompt, apiKey, { maxTokens, temperature }) {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature,
    }),
    signal: AbortSignal.timeout(55000),
  });
  const t = await res.text().catch(() => "");
  if (!res.ok) throw httpError(res.status, "Groq", t);
  const data = JSON.parse(t);
  const content = data.choices?.[0]?.message?.content;
  return parseJsonFromText(typeof content === "string" ? content : JSON.stringify(content));
}

async function callGemini(prompt, apiKey, { maxTokens, temperature }) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature },
      }),
      signal: AbortSignal.timeout(55000),
    },
  );
  const t = await res.text().catch(() => "");
  if (!res.ok) throw httpError(res.status, "Gemini", t);
  const data = JSON.parse(t);
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
  return parseJsonFromText(text);
}

async function callNvidia(prompt, apiKey, model, { maxTokens, temperature }) {
  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature,
      stream: false,
    }),
    signal: AbortSignal.timeout(55000),
  });
  const t = await res.text().catch(() => "");
  if (!res.ok) throw httpError(res.status, "NVIDIA", t);
  const data = JSON.parse(t);
  const content = data.choices?.[0]?.message?.content;
  return parseJsonFromText(typeof content === "string" ? content : JSON.stringify(content));
}

async function tryNvidiaModels(prompt, apiKey, opts) {
  const errors = [];
  for (const model of NVIDIA_MODELS) {
    try {
      return await withRetry(() => callNvidia(prompt, apiKey, model, opts));
    } catch (e) {
      errors.push(e.message);
    }
  }
  throw new Error(errors.join(" · ") || "NVIDIA failed");
}

/**
 * @param {object} [options]
 * @param {number} [options.maxTokens=2048]
 * @param {number} [options.temperature=0.25]
 */
export async function generateWithFallback(prompt, keys, options = {}) {
  const maxTokens = options.maxTokens ?? 2048;
  const temperature = options.temperature ?? 0.25;
  const opts = { maxTokens, temperature };
  const fullPrompt = `${prompt}\n\nReturn ONLY valid JSON. No markdown fences.`;
  const failures = [];

  if (keys.groq?.startsWith("gsk_") || keys.groq?.length >= 30) {
    try {
      const data = await withRetry(() => callGroq(fullPrompt, keys.groq, opts), {
        attempts: 2,
        delays: [0, 1000],
      });
      return { data, provider: "groq", usedFallback: false };
    } catch (e) {
      failures.push(e.message);
    }
  }

  if (keys.gemini?.length >= 20) {
    try {
      const data = await withRetry(() => callGemini(fullPrompt, keys.gemini, opts));
      return { data, provider: "gemini", usedFallback: failures.length > 0 };
    } catch (e) {
      failures.push(e.message);
    }
  }

  if (keys.nvidia?.startsWith("nvapi-")) {
    try {
      const data = await tryNvidiaModels(fullPrompt, keys.nvidia, opts);
      return { data, provider: "nvidia", usedFallback: failures.length > 0 };
    } catch (e) {
      failures.push(e.message);
    }
  }

  if (!hasAnyKey(keys)) {
    throw new Error("No API keys on server. Add GROQ_API_KEY in Vercel/Netlify, then redeploy.");
  }

  throw new Error(failures.join(" · ") || "All AI providers failed");
}
