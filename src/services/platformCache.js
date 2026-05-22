const CACHE_KEY = "insightaxis_platform_intel_v4";
const SESSION_KEY = CACHE_KEY;
/** Skip network if cache is newer than this (fast repeat visits) */
export const FRESH_MS = 1000 * 60 * 30;
/** localStorage kept for returning visitors on production */
const PERSIST_MS = 1000 * 60 * 60 * 6;

function parseEntry(raw) {
  if (!raw) return null;
  const { ts, data } = JSON.parse(raw);
  if (!data || Date.now() - ts > PERSIST_MS) return null;
  return { ts, data };
}

export function readPlatformCache() {
  try {
    const fromLocal = parseEntry(localStorage.getItem(CACHE_KEY));
    if (fromLocal) return { ...fromLocal.data, source: fromLocal.data.source || "cache", cacheAge: Date.now() - fromLocal.ts };
  } catch {
    /* quota / private mode */
  }
  try {
    const fromSession = parseEntry(sessionStorage.getItem(SESSION_KEY));
    if (fromSession) return { ...fromSession.data, source: fromSession.data.source || "cache", cacheAge: Date.now() - fromSession.ts };
  } catch {
    /* ignore */
  }
  return null;
}

export function isCacheFresh(cacheAgeMs) {
  return typeof cacheAgeMs === "number" && cacheAgeMs < FRESH_MS;
}

export function writePlatformCache(data) {
  const entry = JSON.stringify({ ts: Date.now(), data });
  try {
    sessionStorage.setItem(SESSION_KEY, entry);
  } catch {
    /* ignore */
  }
  try {
    localStorage.setItem(CACHE_KEY, entry);
  } catch {
    /* ignore */
  }
}
