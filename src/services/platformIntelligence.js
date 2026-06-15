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

/** AI sometimes returns objects — coerce to display strings */
function coerceFeedLine(item) {
  if (item == null) return "";
  if (typeof item === "string") return item.trim();
  if (typeof item === "object") {
    if (item.name != null && item.move != null) {
      return `${item.name}: ${item.move}`;
    }
    if (item.headline) return String(item.headline);
    if (item.text) return String(item.text);
    if (item.message) return String(item.message);
    if (item.description) return String(item.description);
    const parts = Object.values(item).filter((v) => typeof v === "string" && v.trim());
    if (parts.length) return parts.join(" · ");
  }
  return String(item);
}

function normalizeStringList(arr, max = 5) {
  if (!Array.isArray(arr)) return [];
  return arr.map(coerceFeedLine).filter(Boolean).slice(0, max);
}

function normalizeNewsFeed(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .slice(0, 8)
    .map((item) => {
      if (typeof item === "string") {
        return { headline: item, summary: "", source: "", time: "Recent" };
      }
      if (!item || typeof item !== "object") return null;
      return {
        headline: item.headline || item.title || coerceFeedLine(item),
        summary: item.summary || item.description || "",
        source: item.source || "",
        time: item.time || "Recent",
      };
    })
    .filter((n) => n?.headline);
}

function normalizeAgentOutputs(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, 6).map((a, i) => ({
    id: a?.id || `agent-${i}`,
    status: coerceFeedLine(a?.status) || "Active",
    metric: coerceFeedLine(a?.metric) || "—",
    lastInsight: coerceFeedLine(a?.lastInsight) || "",
  }));
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
    newsFeed: [],
    agentOutputs: [],
    industry: "",
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
    category: typeof ev.category === "string" ? ev.category : "Signal",
    description: coerceFeedLine(ev.description || ev),
    color: colorForCategory(typeof ev.category === "string" ? ev.category : "Signal"),
  }));

  return {
    executiveSummary: coerceFeedLine(raw.executiveSummary) || "",
    strategicInsight: coerceFeedLine(raw.strategicInsight) || "",
    alerts: normalizeStringList(raw.alerts, 5),
    notifications: normalizeStringList(raw.notifications, 5),
    recommendations: normalizeStringList(raw.recommendations, 5),
    riskSignal: coerceFeedLine(raw.riskSignal) || "",
    confidence: typeof raw.confidence === "string" ? raw.confidence : "High",
    generatedAt: raw.generatedAt || new Date().toISOString(),
    kpis: {
      signalsToday: raw.kpis?.signalsToday ?? "—",
      regions: raw.kpis?.regions ?? "—",
      alerts: raw.kpis?.alerts ?? "—",
    },
    competitorFeed: normalizeStringList(raw.competitorFeed, 5),
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
    newsFeed: normalizeNewsFeed(raw.newsFeed),
    agentOutputs: normalizeAgentOutputs(raw.agentOutputs),
    industry: typeof raw.industry === "string" ? raw.industry : meta.industry || "",
    needsApiKey: false,
    isStale: false,
    ...meta,
  };
}

/** Re-coerce lists when reading older cache entries */
export function sanitizeIntel(intel) {
  if (!intel) return intel;
  return {
    ...intel,
    executiveSummary: coerceFeedLine(intel.executiveSummary) || "",
    strategicInsight: coerceFeedLine(intel.strategicInsight) || "",
    riskSignal: coerceFeedLine(intel.riskSignal) || "",
    alerts: normalizeStringList(intel.alerts, 5),
    notifications: normalizeStringList(intel.notifications, 5),
    recommendations: normalizeStringList(intel.recommendations, 5),
    competitorFeed: normalizeStringList(intel.competitorFeed, 5),
    newsFeed: normalizeNewsFeed(intel.newsFeed),
    agentOutputs: normalizeAgentOutputs(intel.agentOutputs),
    timeline: Array.isArray(intel.timeline)
      ? intel.timeline.map((ev, i) => ({
          ...ev,
          id: ev?.id ?? String(i + 1),
          description: coerceFeedLine(ev?.description ?? ev),
        }))
      : [],
  };
}

/** Sync read for instant paint (localStorage / sessionStorage) */
export { readPlatformCache, isCacheFresh, FRESH_MS };

export async function fetchPlatformIntelligence({ forceRefresh = false, industry } = {}) {
  const industryId = industry?.id || "technology";

  if (!forceRefresh) {
    const cached = readPlatformCache(industryId);
    if (cached && isCacheFresh(cached.cacheAge)) {
      return { ...sanitizeIntel(cached), source: "cache", isStale: false, fromCache: true };
    }
  }

  try {
    const { raw, provider, usedFallback, partial } = await requestPlatformIntelligence({
      industryId: industry?.id,
      industryLabel: industry?.label,
      industryDesc: industry?.desc,
    });
    const merged = normalizeIntel(raw, {
      source: provider,
      apiAvailable: true,
      provider,
      usedFallback: Boolean(usedFallback),
      partial,
      industry: industry?.label || raw.industry,
      industryId,
    });
    writePlatformCache(merged, industryId);
    return merged;
  } catch (err) {
    console.warn("[platformIntelligence]", err);
    const stale = readPlatformCache(industryId);
    if (stale) {
      return {
        ...sanitizeIntel(stale),
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
