const CACHE_PREFIX = "insightaxis_platform_intel_v7";
/** Skip network if cache is newer than this */
export const FRESH_MS = 1000 * 60 * 120;
const PERSIST_MS = 1000 * 60 * 60 * 6;

function cacheKey(industryId) {
  return `${CACHE_PREFIX}_${industryId || "technology"}`;
}

function parseEntry(raw) {
  if (!raw) return null;
  const { ts, data } = JSON.parse(raw);
  if (!data || Date.now() - ts > PERSIST_MS) return null;
  return { ts, data };
}

export function readPlatformCache(industryId = "technology") {
  const key = cacheKey(industryId);
  try {
    const fromLocal = parseEntry(localStorage.getItem(key));
    if (fromLocal) {
      return { ...fromLocal.data, source: fromLocal.data.source || "cache", cacheAge: Date.now() - fromLocal.ts };
    }
  } catch {
    /* quota / private mode */
  }
  try {
    const fromSession = parseEntry(sessionStorage.getItem(key));
    if (fromSession) {
      return { ...fromSession.data, source: fromSession.data.source || "cache", cacheAge: Date.now() - fromSession.ts };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function isCacheFresh(cacheAgeMs) {
  return typeof cacheAgeMs === "number" && cacheAgeMs < FRESH_MS;
}

export function writePlatformCache(data, industryId = "technology") {
  const key = cacheKey(industryId);
  const entry = JSON.stringify({ ts: Date.now(), data });
  try {
    sessionStorage.setItem(key, entry);
  } catch {
    /* ignore */
  }
  try {
    localStorage.setItem(key, entry);
  } catch {
    /* ignore */
  }
}
