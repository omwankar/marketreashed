/**
 * Netlify serverless — same logic as api/platform-intelligence.js (Vercel).
 * Set GROQ_API_KEY, VITE_GEMINI_API_KEY, VITE_NVIDIA_API_KEY in Netlify → Environment variables.
 */
import { handlePlatformIntelligenceRequest } from "../../api/platform-intelligence.js";

export default async (request) => {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/\.netlify\/functions\/platform-intelligence/, "/api/platform-intelligence");
  const body =
    request.method !== "GET" && request.method !== "HEAD" ? await request.text() : undefined;

  return handlePlatformIntelligenceRequest(
    new Request(`${url.origin}${path}`, {
      method: request.method,
      headers: request.headers,
      body: body || undefined,
    }),
  );
};
