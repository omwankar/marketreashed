/**
 * Vercel serverless proxy — keeps NVIDIA API key off the client (avoids CORS).
 * Set VITE_NVIDIA_API_KEY or NVIDIA_API_KEY in Vercel project env vars.
 */
export default async function handler(request) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.VITE_NVIDIA_API_KEY || process.env.NVIDIA_API_KEY;
  if (!apiKey?.startsWith("nvapi-")) {
    return new Response(JSON.stringify({ error: "NVIDIA API key not configured on server" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.text();
    const upstream = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body,
    });

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err?.message || "Proxy request failed" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
