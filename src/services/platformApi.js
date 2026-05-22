/** Client → same-origin /api/platform-intelligence (works on Vercel + local dev) */

const API_URL = "/api/platform-intelligence";

export async function fetchPlatformAiStatus() {
  try {
    const res = await fetch(API_URL, { method: "GET" });
    if (!res.ok) return { configured: false, gemini: false, nvidia: false };
    return res.json();
  } catch {
    return { configured: false, gemini: false, nvidia: false };
  }
}

/**
 * @returns {Promise<{ raw: object, provider: string, usedFallback: boolean, partial?: boolean }>}
 */
export async function requestPlatformIntelligence() {
  let res;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
  } catch (err) {
    throw new Error(
      `Cannot reach AI API on server. On Vercel, add env vars and redeploy. (${err?.message || "Failed to fetch"})`,
    );
  }

  const payload = await res.json().catch(() => ({}));

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
