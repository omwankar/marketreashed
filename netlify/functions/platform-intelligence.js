/**
 * Netlify serverless — same logic as api/platform-intelligence.js (Vercel).
 * Set GROQ_API_KEY, VITE_GEMINI_API_KEY, VITE_NVIDIA_API_KEY in Netlify → Environment variables.
 */
import handler from "../../api/platform-intelligence.js";

export default async (request, context) => {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/\.netlify\/functions\/platform-intelligence/, "/api/platform-intelligence");
  const proxyUrl = `${url.origin}${path}`;

  const body =
    request.method !== "GET" && request.method !== "HEAD" ? await request.text() : undefined;

  const webRequest = new Request(proxyUrl, {
    method: request.method,
    headers: request.headers,
    body: body || undefined,
  });

  return handler(webRequest);
};
