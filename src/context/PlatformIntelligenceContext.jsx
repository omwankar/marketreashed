import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchPlatformIntelligence, emptyIntel } from "../services/platformIntelligence.js";
import { getActiveAiProvider, getAiProviderLabel, hasPlatformAiKey } from "../services/aiProvider.js";

function createInitialIntel() {
  const configured = hasPlatformAiKey();
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
  const [loading, setLoading] = useState(() => hasPlatformAiKey());
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (forceRefresh = false) => {
    if (!hasPlatformAiKey()) {
      setIntel(createInitialIntel());
      setLoading(false);
      return;
    }
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await fetchPlatformIntelligence({ forceRefresh });
      setIntel({ ...data, needsApiKey: false });
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
      isLive: intel.source === "nvidia" || intel.source === "gemini" || intel.source === "cache",
      hasData: apiConfigured && (intel.timeline?.length > 0 || intel.executiveSummary?.length > 20),
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
