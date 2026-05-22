/** NVIDIA Integrate API — proxied via /api/nvidia (avoids browser CORS) */

export const NVIDIA_MODEL = "moonshotai/kimi-k2.6";

/** Same-origin proxy (Vite dev middleware + Vercel serverless) */
export const NVIDIA_CHAT_URL = "/api/nvidia/chat/completions";

export function getNvidiaApiKey() {
  const raw = import.meta.env.VITE_NVIDIA_API_KEY ?? "";
  return String(raw).trim().replace(/^['"]|['"]$/g, "");
}

/** Key present in .env — actual calls go through server proxy */
export function hasNvidiaApiKey() {
  const key = getNvidiaApiKey();
  return key.startsWith("nvapi-") && key.length > 24;
}

function parseJsonFromText(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Model response did not contain JSON");
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

/**
 * @param {string} prompt
 * @param {number} maxTokens
 */
export async function generateNvidiaText(prompt, maxTokens = 8192) {
  if (!hasNvidiaApiKey()) {
    throw new Error("Missing VITE_NVIDIA_API_KEY in .env");
  }

  let res;
  try {
    res = await fetch(NVIDIA_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.35,
        top_p: 1,
        stream: false,
      }),
    });
  } catch (err) {
    throw new Error(
      `Network error reaching AI proxy. Restart npm run dev. (${err?.message || "Failed to fetch"})`,
    );
  }

  if (!res.ok) {
    let detail = "";
    try {
      const errJson = await res.json();
      detail = errJson?.error?.message || errJson?.error || JSON.stringify(errJson).slice(0, 200);
    } catch {
      detail = await res.text().catch(() => "");
    }
    throw new Error(`NVIDIA API failed (${res.status})${detail ? `: ${detail}` : ""}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from NVIDIA API");
  }
  return typeof content === "string" ? content : JSON.stringify(content);
}

export async function generateNvidiaJson(prompt, maxTokens = 8192) {
  const text = await generateNvidiaText(
    `${prompt}\n\nReturn ONLY a single valid JSON object. No markdown fences, no commentary.`,
    maxTokens,
  );
  return parseJsonFromText(text);
}
