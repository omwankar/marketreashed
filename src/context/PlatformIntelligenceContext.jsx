import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchPlatformIntelligence,
  emptyIntel,
  readPlatformCache,
  isCacheFresh,
} from "../services/platformIntelligence.js";
import { getAiProviderLabel, resolvePlatformAiConfigured } from "../services/aiProvider.js";

function createInitialIntel() {
  const cached = readPlatformCache();
  if (cached) {
    return { ...cached, needsApiKey: false, isStale: !isCacheFresh(cached.cacheAge) };
  }
  return { ...emptyIntel(), needsApiKey: false, source: "loading" };
}

const PlatformIntelligenceContext = createContext(null);

export function PlatformIntelligenceProvider({ children }) {
  const [intel, setIntel] = useState(createInitialIntel);
  const hadCache = useRef(Boolean(readPlatformCache()));
  const [apiConfigured, setApiConfigured] = useState(false);
  const [providerLabel, setProviderLabel] = useState(null);
  const [loading, setLoading] = useState(!hadCache.current);
  const [refreshing, setRefreshing] = useState(false);
  const bootstrapped = useRef(false);

  const load = useCallback(async (forceRefresh = false) => {
    const showFullLoading = forceRefresh || !intel.timeline?.length;
    if (showFullLoading) setLoading(true);
    else setRefreshing(true);

    try {
      const data = await fetchPlatformIntelligence({ forceRefresh });
      setIntel({ ...data, needsApiKey: false, isStale: Boolean(data.isStale) });
    } catch (err) {
      setIntel({
        ...emptyIntel(),
        needsApiKey: false,
        source: "error",
        apiAvailable: true,
        error: err?.message || "AI request failed",
        executiveSummary:
          "Could not reach AI on server. Add GROQ_API_KEY (fastest) and/or other keys in Vercel → Environment Variables, then redeploy.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [intel.timeline?.length]);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    resolvePlatformAiConfigured().then((status) => {
      setApiConfigured(status.configured);

      setProviderLabel(getAiProviderLabel(status));

      if (!status.configured) {
        setIntel({ ...emptyIntel(), needsApiKey: true, source: "unconfigured" });
        setLoading(false);
        return;
      }

      const cached = readPlatformCache();
      if (cached && isCacheFresh(cached.cacheAge)) {
        setLoading(false);
        return;
      }

      load(false);
    });
  }, [load]);

  const value = useMemo(
    () => ({
      intel,
      loading,
      refreshing,
      refresh: () => load(true),
      apiConfigured,
      providerLabel,
      isLive:
        (intel.source === "groq" ||
          intel.source === "nvidia" ||
          intel.source === "gemini" ||
          intel.source === "cache") &&
        !intel.isStale,
      hasData: apiConfigured && (intel.timeline?.length > 0 || intel.executiveSummary?.length > 20),
      isStale: Boolean(intel.isStale),
    }),
    [intel, loading, refreshing, load, apiConfigured, providerLabel],
  );

  return (
    <PlatformIntelligenceContext.Provider value={value}>
      {children}
    </PlatformIntelligenceContext.Provider>
  );
}

export function usePlatformIntelligence() {
  const ctx = useContext(PlatformIntelligenceContext);
  if (!ctx) {
    throw new Error("usePlatformIntelligence must be used within PlatformIntelligenceProvider");
  }
  return ctx;
}
