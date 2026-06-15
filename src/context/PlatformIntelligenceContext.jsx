import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchPlatformIntelligence,
  emptyIntel,
  readPlatformCache,
  isCacheFresh,
  sanitizeIntel,
} from "../services/platformIntelligence.js";
import { getAiProviderLabel, resolvePlatformAiConfigured } from "../services/aiProvider.js";
import {
  getRadarIndustry,
  readStoredRadarIndustry,
  writeStoredRadarIndustry,
} from "../data/radarIndustries.js";

function createInitialIntel(industryId) {
  const cached = readPlatformCache(industryId);
  if (cached) {
    return {
      ...sanitizeIntel(cached),
      needsApiKey: false,
      isStale: !isCacheFresh(cached.cacheAge),
    };
  }
  return { ...emptyIntel(), needsApiKey: false, source: "loading" };
}

const PlatformIntelligenceContext = createContext(null);

export function PlatformIntelligenceProvider({ children }) {
  const [industryId, setIndustryIdState] = useState(readStoredRadarIndustry);
  const industry = useMemo(() => getRadarIndustry(industryId), [industryId]);
  const [intel, setIntel] = useState(() => createInitialIntel(industryId));
  const hadCache = useRef(Boolean(readPlatformCache(industryId)));
  const [apiConfigured, setApiConfigured] = useState(false);
  const [setupHint, setSetupHint] = useState(null);
  const [apiMissing, setApiMissing] = useState(false);
  const [providerLabel, setProviderLabel] = useState(null);
  const [loading, setLoading] = useState(!hadCache.current);
  const [refreshing, setRefreshing] = useState(false);
  const bootstrapped = useRef(false);

  const load = useCallback(
    async (forceRefresh = false, nextIndustry = industry) => {
      const showFullLoading = forceRefresh || !intel.timeline?.length;
      if (showFullLoading) setLoading(true);
      else setRefreshing(true);

      try {
        const data = await fetchPlatformIntelligence({ forceRefresh, industry: nextIndustry });
        setIntel({ ...data, needsApiKey: false, isStale: Boolean(data.isStale) });
      } catch (err) {
        setIntel({
          ...emptyIntel(),
          needsApiKey: false,
          source: "error",
          apiAvailable: true,
          error: err?.message || "AI request failed",
          executiveSummary:
            "Could not reach AI on server. Add GROQ_API_KEY in Vercel → Environment Variables, then redeploy.",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [industry, intel.timeline?.length],
  );

  const setIndustryId = useCallback(
    (id) => {
      if (id === industryId) return;
      const next = getRadarIndustry(id);
      writeStoredRadarIndustry(id);
      setIndustryIdState(id);
      hadCache.current = Boolean(readPlatformCache(id));
      setIntel(createInitialIntel(id));
      if (apiConfigured) {
        load(true, next);
      }
    },
    [apiConfigured, industryId, load],
  );

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    resolvePlatformAiConfigured().then((status) => {
      setApiConfigured(status.configured);
      setSetupHint(status.hint || null);
      setApiMissing(Boolean(status.apiMissing));
      setProviderLabel(getAiProviderLabel(status));

      if (!status.configured) {
        setIntel({
          ...emptyIntel(),
          needsApiKey: true,
          source: "unconfigured",
          setupHint: status.hint,
          apiMissing: Boolean(status.apiMissing),
        });
        setLoading(false);
        return;
      }

      const cached = readPlatformCache(industryId);
      if (cached && isCacheFresh(cached.cacheAge)) {
        setIntel({ ...sanitizeIntel(cached), needsApiKey: false, isStale: false });
        setLoading(false);
        return;
      }

      load(false, industry);
    });
  }, [industry, industryId, load]);

  const value = useMemo(
    () => ({
      intel,
      loading,
      refreshing,
      refresh: () => load(true, industry),
      apiConfigured,
      setupHint,
      apiMissing,
      providerLabel,
      industryId,
      industryLabel: industry.label,
      setIndustryId,
      isLive:
        (intel.source === "groq" ||
          intel.source === "nvidia" ||
          intel.source === "gemini" ||
          intel.source === "cache") &&
        !intel.isStale,
      hasData: apiConfigured && (intel.timeline?.length > 0 || intel.executiveSummary?.length > 20),
      isStale: Boolean(intel.isStale),
    }),
    [
      intel,
      loading,
      refreshing,
      load,
      industry,
      apiConfigured,
      setupHint,
      apiMissing,
      providerLabel,
      industryId,
      setIndustryId,
    ],
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
