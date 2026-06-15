/** Client → /api/platform-intelligence (Vercel api/ or Netlify functions) */

const API_URL = "/api/platform-intelligence";

function emptyStatus(extra = {}) {
  return { configured: false, groq: false, gemini: false, nvidia: false, ...extra };
}

async function parseStatusResponse(res) {
  const text = await res.text();
  const trimmed = text.trim();

  if (trimmed.startsWith("<") || trimmed.startsWith("<!")) {
    return emptyStatus({
      apiMissing: true,
      hint: "Host returned HTML instead of JSON — API route is not deployed. Use Vercel (repo root) or Netlify with netlify.toml + redeploy.",
    });
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return emptyStatus({
      apiMissing: true,
      hint: "Invalid API response. Redeploy after adding server functions.",
    });
  }
}

export async function fetchPlatformAiStatus() {
  try {
    const res = await fetch(API_URL, { method: "GET", cache: "no-store" });
    const data = await parseStatusResponse(res);
    if (!res.ok) return { ...emptyStatus(), ...data };
    return data;
  } catch (err) {
    return emptyStatus({
      apiMissing: true,
      hint: `Cannot reach ${API_URL}. (${err?.message || "network error"})`,
    });
  }
}

/**
 * @returns {Promise<{ raw: object, provider: string, usedFallback: boolean, partial?: boolean }>}
 */
export async function requestPlatformIntelligence({ industryId, industryLabel, industryDesc } = {}) {
  let res;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ industryId, industryLabel, industryDesc }),
      cache: "no-store",
    });
  } catch (err) {
    throw new Error(
      `Cannot reach AI API. If on Netlify/Vercel, add env vars and redeploy. (${err?.message || "Failed to fetch"})`,
    );
  }

  const text = await res.text();
  let payload = {};
  try {
    payload = JSON.parse(text);
  } catch {
    if (text.trim().startsWith("<")) {
      throw new Error(
        "Server API not running on this host. Deploy on Vercel (api folder) or Netlify (with netlify.toml), then redeploy.",
      );
    }
  }

  if (!res.ok) {
    const err = new Error(payload?.error || `Server error (${res.status})`);
    err.code = payload?.code;
    err.status = res.status;
    throw err;
  }

  if (!payload.raw) {
    throw new Error(payload?.error || "Invalid server response");
  }

  return payload;
}
