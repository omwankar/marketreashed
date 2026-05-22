import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchPlatformIntelligence,
  emptyIntel,
  readPlatformCache,
  isCacheFresh,
} from "../services/platformIntelligence.js";
import { getActiveAiProvider, getAiProviderLabel, hasPlatformAiKey } from "../services/aiProvider.js";

function createInitialIntel() {
  const cached = readPlatformCache();
  const configured = hasPlatformAiKey();
  if (cached) {
    return { ...cached, needsApiKey: false, isStale: !isCacheFresh(cached.cacheAge) };
  }
  return {
    ...emptyIntel(),
    needsApiKey: !configured,
    source: configured ? "loading" : "unconfigured",
    apiAvailable: configured,
    provider: getActiveAiProvider(),
  };
}

const PlatformIntelligenceContext = createContext(null);

export function PlatformIntelligenceProvider({ children }) {
  const [intel, setIntel] = useState(createInitialIntel);
  const hadCache = useRef(Boolean(readPlatformCache()));
  const [loading, setLoading] = useState(() => hasPlatformAiKey() && !hadCache.current);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (forceRefresh = false) => {
    if (!hasPlatformAiKey()) {
      setIntel(createInitialIntel());
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const showFullLoading = forceRefresh || !intel.timeline?.length;
    if (showFullLoading) setLoading(true);
    else setRefreshing(true);

    try {
      const data = await fetchPlatformIntelligence({ forceRefresh });
      setIntel({ ...data, needsApiKey: false, isStale: Boolean(data.isStale) });
    } catch (err) {
      setIntel({
        ...createInitialIntel(),
        needsApiKey: false,
        source: "error",
        apiAvailable: true,
        error: err?.message || "AI request failed",
        executiveSummary: "Could not reach AI provider. Click Refresh to try again.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!hasPlatformAiKey()) return;
    const cached = readPlatformCache();
    if (cached && isCacheFresh(cached.cacheAge)) return;
    load(false);
  }, [load]);

  const apiConfigured = hasPlatformAiKey();
  const providerLabel = getAiProviderLabel();

  const value = useMemo(
    () => ({
      intel,
      loading,
      refreshing,
      refresh: () => load(true),
      apiConfigured,
      providerLabel,
      isLive:
        (intel.source === "nvidia" || intel.source === "gemini" || intel.source === "cache") && !intel.isStale,
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
