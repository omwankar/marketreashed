/**
 * Radar AI on server — fastest provider first: Groq → Gemini → NVIDIA.
 * Env: GROQ_API_KEY (or VITE_GROQ_API_KEY), VITE_GEMINI_API_KEY, VITE_NVIDIA_API_KEY
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "deepseek-r1-distill-llama-70b";
const GEMINI_MODEL = "gemini-2.0-flash";
const NVIDIA_MODELS = ["meta/llama-3.1-8b-instruct", "moonshotai/kimi-k2.6"];
const TOKEN_BUDGET = 1536;
const RETRYABLE = new Set([429, 502, 503, 504]);

const FULL_PROMPT = `Enterprise competitive intelligence. Competitors A,B,C. Regions APAC,EMEA,India,NA.

Return ONLY one JSON object (no markdown):
{"executiveSummary":"2 sentences","strategicInsight":"1 short paragraph","alerts":["3 with emoji"],"notifications":["3 short"],"recommendations":["3 actions"],"riskSignal":"1 sentence","confidence":"High","generatedAt":"ISO date","kpis":{"signalsToday":"18.4K","regions":42,"alerts":23},"competitorFeed":["3 lines"],"timeline":[{"time":"2m ago","category":"Pricing","description":"event"},...4],"momentumTrend":[{"label":"W1","value":50},...6 varied 30-95],"velocityTrend":[{"label":"W1","value":40},...6],"marketShareTrend":[{"month":"Jan","you":30,"a":22,"b":18},...4],"activityByDay":[{"day":"Mon","intensity":55},...7],"signalTrend":[{"month":"Jan","signals":4000},...4],"competitorTable":[{"name":"Competitor A","activity":"High","change":"+12%","region":"APAC"},...4],"dashboardKpis":[{"label":"Market Coverage","value":"2,400+","sub":"segments"},...4]}`;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function firstEnv(...names) {
  for (const name of names) {
    const v = process.env[name];
    if (v && String(v).trim()) return String(v).trim();
  }
  return "";
}

function getKeys() {
  const groq = firstEnv("GROQ_API_KEY", "VITE_GROQ_API_KEY", "GROQ_KEY");
  const gemini = firstEnv("VITE_GEMINI_API_KEY", "GEMINI_API_KEY", "GOOGLE_GEMINI_API_KEY");
  const nvidia = firstEnv("VITE_NVIDIA_API_KEY", "NVIDIA_API_KEY");
  return { groq, gemini, nvidia };
}

function hasAnyKey(keys) {
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

function stripModelReasoning(text) {
  return String(text)
    .replace(/[\s\S]*?<\/think>/gi, "")
    .replace(/```json|```/g, "")
    .trim();
}

function parseJsonFromText(text) {
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

async function callGroq(prompt, apiKey) {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: `${prompt}\n\nReturn ONLY valid JSON. No markdown.` }],
      max_tokens: TOKEN_BUDGET,
      temperature: 0.35,
    }),
    signal: AbortSignal.timeout(45000),
  });
  const t = await res.text().catch(() => "");
  if (!res.ok) throw httpError(res.status, "Groq", t);
  const data = JSON.parse(t);
  const content = data.choices?.[0]?.message?.content;
  return parseJsonFromText(typeof content === "string" ? content : JSON.stringify(content));
}

async function callGemini(prompt, apiKey) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${prompt}\n\nReturn ONLY valid JSON. No markdown.` }] }],
        generationConfig: { maxOutputTokens: TOKEN_BUDGET, temperature: 0.35 },
      }),
      signal: AbortSignal.timeout(50000),
    },
  );
  const t = await res.text().catch(() => "");
  if (!res.ok) throw httpError(res.status, "Gemini", t);
  const data = JSON.parse(t);
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
  return parseJsonFromText(text);
}

async function callNvidia(prompt, apiKey, model) {
  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: `${prompt}\n\nReturn ONLY valid JSON. No markdown.` }],
      max_tokens: TOKEN_BUDGET,
      temperature: 0.35,
      stream: false,
    }),
    signal: AbortSignal.timeout(50000),
  });
  const t = await res.text().catch(() => "");
  if (!res.ok) throw httpError(res.status, "NVIDIA", t);
  const data = JSON.parse(t);
  const content = data.choices?.[0]?.message?.content;
  return parseJsonFromText(typeof content === "string" ? content : JSON.stringify(content));
}

async function tryNvidiaModels(prompt, apiKey) {
  const errors = [];
  for (const model of NVIDIA_MODELS) {
    try {
      const data = await withRetry(() => callNvidia(prompt, apiKey, model));
      return data;
    } catch (e) {
      errors.push(e.message);
    }
  }
  throw new Error(errors.join(" · ") || "NVIDIA failed");
}

async function generateWithFallback(prompt, keys) {
  const failures = [];

  if (keys.groq?.startsWith("gsk_") || keys.groq?.length >= 30) {
    try {
      const data = await withRetry(() => callGroq(prompt, keys.groq), { attempts: 2, delays: [0, 1000] });
      return { data, provider: "groq", usedFallback: false };
    } catch (e) {
      failures.push(e.message);
    }
  }

  if (keys.gemini?.length >= 20) {
    try {
      const data = await withRetry(() => callGemini(prompt, keys.gemini));
      return { data, provider: "gemini", usedFallback: failures.length > 0 };
    } catch (e) {
      failures.push(e.message);
    }
  }

  if (keys.nvidia?.startsWith("nvapi-")) {
    try {
      const data = await tryNvidiaModels(prompt, keys.nvidia);
      return { data, provider: "nvidia", usedFallback: failures.length > 0 };
    } catch (e) {
      failures.push(e.message);
    }
  }

  if (!hasAnyKey(keys)) {
    throw new Error(
      "No API keys on server. Add GROQ_API_KEY (recommended), and/or VITE_GEMINI_API_KEY, VITE_NVIDIA_API_KEY in Vercel.",
    );
  }

  throw new Error(failures.join(" · ") || "All AI providers failed");
}

async function fetchFreshIntel(keys) {
  const result = await generateWithFallback(FULL_PROMPT, keys);
  return {
    raw: result.data,
    provider: result.provider,
    usedFallback: result.usedFallback,
    partial: false,
  };
}

export default async function handler(request) {
  const keys = getKeys();

  if (request.method === "GET") {
    const groqOk = Boolean(keys.groq?.startsWith("gsk_") || keys.groq?.length >= 30);
    return jsonResponse({
      configured: hasAnyKey(keys),
      groq: groqOk,
      gemini: Boolean(keys.gemini?.length >= 20),
      nvidia: Boolean(keys.nvidia?.startsWith("nvapi-")),
      primary: groqOk ? "groq" : keys.gemini?.length >= 20 ? "gemini" : "nvidia",
      hint: !hasAnyKey(keys)
        ? "Set GROQ_API_KEY (gsk_...) on Netlify/Vercel Production, then redeploy."
        : undefined,
    });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const result = await fetchFreshIntel(keys);
    return jsonResponse(result);
  } catch (err) {
    const message = err?.message || "Intelligence generation failed";
    const isQuota = message.includes("rate limit") || message.includes("quota");
    return jsonResponse({ error: message, code: isQuota ? "quota_exceeded" : "provider_error" }, isQuota ? 429 : 500);
  }
}
