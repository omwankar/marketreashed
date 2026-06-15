/** Client → /api/generate-report (server-side AI, keys not in browser) */

const API_URL = "/api/generate-report";

export async function requestGenerateReport(payload) {
  let res;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch (err) {
    throw new Error(`Cannot reach report AI API. (${err?.message || "network error"})`);
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data?.error || `Server error (${res.status})`);
    err.code = data?.code;
    err.status = res.status;
    throw err;
  }

  if (!data.report) {
    throw new Error(data?.error || "Invalid report response");
  }

  return data;
}
