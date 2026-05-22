import { requestPlatformIntelligence } from "./platformApi.js";
import {
  FRESH_MS,
  isCacheFresh,
  readPlatformCache,
  writePlatformCache,
} from "./platformCache.js";

const CATEGORY_COLORS = {
  "Product Launch": "#06b6d4",
  Pricing: "#f59e0b",
  Hiring: "#8b5cf6",
  Acquisition: "#ef4444",
  Expansion: "#22c55e",
  Innovation: "#3b82f6",
  Digital: "#ec4899",
  "Executive Signal": "#94a3b8",
};

function colorForCategory(category) {
  return CATEGORY_COLORS[category] || "#94a3b8";
}

export function emptyIntel(overrides = {}) {
  return {
    executiveSummary: "",
    strategicInsight: "",
    alerts: [],
    notifications: [],
    recommendations: [],
    riskSignal: "",
    confidence: "Medium",
    generatedAt: new Date().toISOString(),
    kpis: { signalsToday: "—", regions: "—", alerts: "—" },
    competitorFeed: [],
    momentumTrend: [],
    velocityTrend: [],
    timeline: [],
    marketShareTrend: [],
    activityByDay: [],
    signalTrend: [],
    competitorTable: [],
    dashboardKpis: [],
    needsApiKey: true,
    source: "unconfigured",
    apiAvailable: false,
    provider: null,
    isStale: false,
    ...overrides,
  };
}

function normalizeTrendPoint(p, i) {
  const label = p?.label || p?.month || `W${i + 1}`;
  const value = Math.min(100, Math.max(0, Number(p?.value) || 0));
  return { label, month: label, value };
}

function normalizeIntel(raw, meta) {
  const momentum = (raw.momentumTrend || []).slice(0, 6).map(normalizeTrendPoint);
  const velocity = (raw.velocityTrend || []).slice(0, 6).map(normalizeTrendPoint);
  while (momentum.length < 6) {
    momentum.push({ label: `W${momentum.length + 1}`, month: `W${momentum.length + 1}`, value: 0 });
  }

  const timeline = (raw.timeline || []).slice(0, 8).map((ev, i) => ({
    id: String(i + 1),
    time: ev.time || "—",
    category: ev.category || "Signal",
    description: ev.description || "",
    color: colorForCategory(ev.category),
  }));

  return {
    executiveSummary: raw.executiveSummary || "",
    strategicInsight: raw.strategicInsight || "",
    alerts: Array.isArray(raw.alerts) ? raw.alerts.slice(0, 5) : [],
    notifications: Array.isArray(raw.notifications) ? raw.notifications.slice(0, 5) : [],
    recommendations: Array.isArray(raw.recommendations) ? raw.recommendations.slice(0, 5) : [],
    riskSignal: raw.riskSignal || "",
    confidence: raw.confidence || "High",
    generatedAt: raw.generatedAt || new Date().toISOString(),
    kpis: {
      signalsToday: raw.kpis?.signalsToday ?? "—",
      regions: raw.kpis?.regions ?? "—",
      alerts: raw.kpis?.alerts ?? "—",
    },
    competitorFeed: Array.isArray(raw.competitorFeed) ? raw.competitorFeed.slice(0, 5) : [],
    momentumTrend: momentum,
    velocityTrend: velocity.length
      ? velocity.map(normalizeTrendPoint)
      : momentum.map((p) => ({ ...p, value: Math.max(0, p.value - 12) })),
    timeline,
    marketShareTrend: (raw.marketShareTrend || []).slice(0, 8),
    activityByDay: (raw.activityByDay || []).slice(0, 7),
    signalTrend: (raw.signalTrend || []).slice(0, 12),
    competitorTable: (raw.competitorTable || []).slice(0, 6),
    dashboardKpis: (raw.dashboardKpis || []).slice(0, 4),
    needsApiKey: false,
    isStale: false,
    ...meta,
  };
}

/** Sync read for instant paint (localStorage / sessionStorage) */
export { readPlatformCache, isCacheFresh, FRESH_MS };

export async function fetchPlatformIntelligence({ forceRefresh = false } = {}) {
  if (!forceRefresh) {
    const cached = readPlatformCache();
    if (cached && isCacheFresh(cached.cacheAge)) {
      return { ...cached, source: "cache", isStale: false, fromCache: true };
    }
  }

  try {
    const { raw, provider, usedFallback, partial } = await requestPlatformIntelligence();
    const merged = normalizeIntel(raw, {
      source: provider,
      apiAvailable: true,
      provider,
      usedFallback: Boolean(usedFallback),
      partial,
    });
    writePlatformCache(merged);
    return merged;
  } catch (err) {
    console.warn("[platformIntelligence]", err);
    const stale = readPlatformCache();
    if (stale) {
      return {
        ...stale,
        source: "cache",
        isStale: true,
        error: err?.message,
        errorCode: err?.code,
        executiveSummary:
          stale.executiveSummary ||
          "Showing last saved intelligence — live refresh failed (quota or provider timeout).",
      };
    }
    return emptyIntel({
      source: "error",
      apiAvailable: true,
      needsApiKey: false,
      error: err?.message || "AI request failed",
      errorCode: err?.code,
      executiveSummary: "Unable to refresh intelligence. See message below, then try once later.",
    });
  }
}
