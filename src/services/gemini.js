export const GEMINI_MODEL = "gemini-2.0-flash";

/** Read Gemini key from Vite env (trim quotes/whitespace). */
export function getGeminiApiKey() {
  const raw = import.meta.env.VITE_GEMINI_API_KEY ?? "";
  const cleaned = String(raw).trim().replace(/^['"]|['"]$/g, "");
  return cleaned;
}

export function hasGeminiApiKey() {
  const key = getGeminiApiKey();
  return key.length >= 20 && key !== "undefined" && key !== "null";
}

export async function generateGeminiText(prompt, maxOutputTokens = 1800, temperature = 0.4) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Missing VITE_GEMINI_API_KEY in environment");
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens, temperature },
      }),
    },
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini request failed (${res.status})${errText ? `: ${errText.slice(0, 120)}` : ""}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text).join("") || "";
}

function parseJsonFromText(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Gemini response did not contain JSON");
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

export async function generateGeminiJson(prompt, maxOutputTokens = 8192) {
  const text = await generateGeminiText(
    `${prompt}\n\nReturn ONLY valid JSON. No markdown fences, no commentary.`,
    maxOutputTokens,
    0.35,
  );
  return parseJsonFromText(text);
}
