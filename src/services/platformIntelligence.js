import { generatePlatformJson, hasPlatformAiKey } from "./aiProvider.js";

const CACHE_KEY = "insightaxis_platform_intel_v3";
const CACHE_TTL_MS = 1000 * 60 * 45;

const CATEGORY_COLORS = {
  "Product Launch": "#06b6d4",
  Pricing: "#f59e0b",
  Hiring: "#8b5cf6",
  Acquisition: "#ef4444",
  Expansion: "#22c55e",
  Innovation: "#3b82f6",
  Digital: "#ec4899",
  "Executive Signal": "#94a3b8",
  Regulatory: "#f97316",
  Partnership: "#14b8a6",
};

const INTELLIGENCE_PROMPT = `You are the strategic intelligence engine for InsightAxis Intelligence (enterprise competitive intelligence).

Generate ONE fresh intelligence snapshot for a Fortune 500 strategy team (FMCG, industrial, tech). Use fictional competitors "Competitor A", "B", "C". Regions: APAC, EMEA, India, North America.

Return ONLY valid JSON with this exact shape (no markdown):
{
  "executiveSummary": "2 sentences, board-ready",
  "strategicInsight": "1 paragraph, highest-priority threat",
  "alerts": ["3 strings with emoji prefix e.g. 🔴 📈 ⚡"],
  "notifications": ["3 short toasts, max 12 words each"],
  "recommendations": ["3 actionable strategies"],
  "riskSignal": "one sentence warning",
  "confidence": "High" or "Medium",
  "generatedAt": "ISO-8601 datetime",
  "kpis": { "signalsToday": "18.4K", "regions": 42, "alerts": 23 },
  "competitorFeed": ["3 lines like Competitor A · action · region"],
  "momentumTrend": [{ "label": "W1", "value": number }, ... exactly 6 weeks, values 30-95],
  "velocityTrend": [{ "label": "W1", "value": number }, ... exactly 6 weeks],
  "timeline": [{ "time": "2m ago", "category": "Product Launch|Pricing|Hiring|Acquisition|Expansion|Innovation|Digital|Executive Signal", "description": "specific event" }, ... 6 events, newest first],
  "marketShareTrend": [{ "month": "Jan", "you": number, "a": number, "b": number }, ... 6 months],
  "activityByDay": [{ "day": "Mon", "intensity": number }, ... 7 days Mon-Sun, intensity 15-95 varied],
  "signalTrend": [{ "month": "Jan", "signals": number }, ... 6 months, rising trend],
  "competitorTable": [{ "name": "Competitor A", "activity": "High|Medium|Low", "change": "+12%", "region": "APAC" }, ... 4 rows],
  "dashboardKpis": [{ "label": "Market Coverage", "value": "2,400+", "sub": "segments tracked" }, ... 4 items]
}

All numbers must be realistic and varied (not identical bars). Timeline descriptions must be unique and specific.`;

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
    ...meta,
  };
}

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    /* ignore */
  }
}

export async function fetchPlatformIntelligence({ forceRefresh = false } = {}) {
  if (!forceRefresh) {
    const cached = readCache();
    if (cached) return { ...cached, source: "cache" };
  }

  if (!hasPlatformAiKey()) {
    return emptyIntel();
  }

  try {
    const { data, provider, usedFallback } = await generatePlatformJson(INTELLIGENCE_PROMPT, 8192);
    const merged = normalizeIntel(data, {
      source: provider,
      apiAvailable: true,
      provider,
      usedFallback: Boolean(usedFallback),
    });
    writeCache(merged);
    return merged;
  } catch (err) {
    console.warn("[platformIntelligence]", err);
    return emptyIntel({
      source: "error",
      apiAvailable: true,
      needsApiKey: false,
      error: err?.message || "AI request failed",
      executiveSummary: "Unable to load AI intelligence. Check Gemini and NVIDIA keys in .env, then click Refresh.",
    });
  }
}
