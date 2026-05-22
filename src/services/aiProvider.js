import { fetchPlatformAiStatus } from "./platformApi.js";

/** Build-time hint (optional); production uses GET /api/platform-intelligence */
export function hasPlatformAiKeyBuildHint() {
  return import.meta.env.VITE_AI_ENABLED === "true";
}

let cachedStatus = null;

export async function resolvePlatformAiConfigured() {
  if (cachedStatus) return cachedStatus;
  cachedStatus = await fetchPlatformAiStatus();
  return cachedStatus;
}

export function hasPlatformAiKey() {
  return hasPlatformAiKeyBuildHint();
}

export function getActiveAiProvider() {
  if (cachedStatus?.groq) return "groq";
  if (cachedStatus?.gemini) return "gemini";
  if (cachedStatus?.nvidia) return "nvidia";
  return null;
}

export function getAiProviderLabel(status = cachedStatus) {
  if (!status?.configured) return null;
  if (status.groq) {
    const fallbacks = [status.gemini && "Gemini", status.nvidia && "NVIDIA"].filter(Boolean);
    return fallbacks.length
      ? `Groq · DeepSeek R1 (${fallbacks.join(" · ")} fallback)`
      : "Groq · DeepSeek R1";
  }
  if (status.gemini && status.nvidia) return "Google Gemini · NVIDIA fallback";
  if (status.gemini) return "Google Gemini";
  if (status.nvidia) return "NVIDIA";
  return "AI";
}

export function getProviderDisplayName(provider) {
  if (provider === "groq") return "Groq · DeepSeek R1";
  if (provider === "gemini") return "Google Gemini";
  if (provider === "nvidia") return "NVIDIA";
  if (provider === "cache") return "Cached";
  return provider || "AI";
}

/** @deprecated Client uses /api/platform-intelligence instead */
export async function generatePlatformJson() {
  throw new Error("Use requestPlatformIntelligence() — AI runs on server");
}
