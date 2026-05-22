import { generateGeminiJson, hasGeminiApiKey } from "./gemini.js";
import { generateNvidiaJson, hasNvidiaApiKey, NVIDIA_MODEL } from "./nvidia.js";

/** True if Radar can call Gemini and/or NVIDIA */
export function hasPlatformAiKey() {
  return hasGeminiApiKey() || hasNvidiaApiKey();
}

/** Primary provider when both keys exist: Gemini first */
export function getActiveAiProvider() {
  if (hasGeminiApiKey()) return "gemini";
  if (hasNvidiaApiKey()) return "nvidia";
  return null;
}

export function getAiProviderLabel() {
  if (hasGeminiApiKey() && hasNvidiaApiKey()) {
    return "Google Gemini · NVIDIA fallback";
  }
  if (hasGeminiApiKey()) return "Google Gemini";
  if (hasNvidiaApiKey()) return `NVIDIA · ${NVIDIA_MODEL}`;
  return null;
}

/**
 * Try Gemini first; if it fails and NVIDIA key exists, use NVIDIA.
 */
export async function generatePlatformJson(prompt, maxTokens = 8192) {
  const failures = [];

  if (hasGeminiApiKey()) {
    try {
      const data = await generateGeminiJson(prompt, maxTokens);
      return { data, provider: "gemini", usedFallback: false };
    } catch (err) {
      console.warn("[aiProvider] Gemini failed:", err);
      failures.push(`Gemini: ${err?.message || "failed"}`);
    }
  }

  if (hasNvidiaApiKey()) {
    try {
      const data = await generateNvidiaJson(prompt, maxTokens);
      return {
        data,
        provider: "nvidia",
        usedFallback: failures.length > 0,
      };
    } catch (err) {
      console.warn("[aiProvider] NVIDIA failed:", err);
      failures.push(`NVIDIA: ${err?.message || "failed"}`);
    }
  }

  if (!hasGeminiApiKey() && !hasNvidiaApiKey()) {
    throw new Error(
      "No AI API key configured. Add VITE_GEMINI_API_KEY and/or VITE_NVIDIA_API_KEY to .env",
    );
  }

  throw new Error(failures.join(" · ") || "All AI providers failed");
}
