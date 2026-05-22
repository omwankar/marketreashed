/** @typedef {{ month: string; value: number }} ChartPoint */
/** @typedef {{ id: string; time: string; category: string; description: string; color: string }} TimelineEvent */
/** @typedef {{ quote: string; role: string; company: string; initials: string }} Testimonial */
/** @typedef {{ id: string; label: string; name: string; hook: string; icon: string; data: ChartPoint[] }} IndustryCard */
/** @typedef {{ id: string; title: string; desc: string; status: string; workflow: string[]; metric: string }} AgentCard */
/** @typedef {{ id: string; title: string; description: string; icon: string; chartType: string; data: ChartPoint[] }} OverviewFeature */
/** @typedef {{ id: string; label: string; title: string; insight: string }} CapabilityTab */
/** @typedef {{ value: number; suffix: string; label: string; icon: string }} MetricItem */

export const TRUST_SEGMENTS = [
  { label: "FMCG", logos: ["UNILEVER", "ITC", "MARICO", "NESTLÉ"] },
  { label: "Food & Beverage", logos: ["NESTLÉ", "PEPSICO", "DANONE", "COCA-COLA"] },
  { label: "Industrial", logos: ["3M", "BASF", "SIEMENS", "HONEYWELL"] },
  { label: "Consulting", logos: ["BCG", "DELOITTE", "KPMG", "ACCENTURE"] },
  { label: "Manufacturing", logos: ["RELIANCE", "HENKEL", "DOW", "BASF"] },
];

export const TRUSTED_LOGOS = TRUST_SEGMENTS.flatMap((s) => s.logos);

export const HERO_ALERTS = [
  { id: 1, text: "Competitor launched new SKU — India market", icon: "🔴" },
  { id: 2, text: "Pricing shift detected — APAC +12%", icon: "📈" },
  { id: 3, text: "Hiring spike: 38% increase — EMEA", icon: "⚡" },
];

export const LIVE_TOASTS = [
  "Competitor launched new product in India",
  "Hiring increased 32% in APAC",
  "Raw material price volatility detected",
];

export const TIMELINE_EVENTS = [
  { id: "1", time: "2m ago", category: "Product Launch", description: "Launched new product line in Southeast Asia", color: "#06b6d4" },
  { id: "2", time: "18m ago", category: "Pricing", description: "Reduced distributor margin by 4%", color: "#f59e0b" },
  { id: "3", time: "1h ago", category: "Hiring", description: "Posted 340 engineering roles in Bengaluru", color: "#8b5cf6" },
  { id: "4", time: "3h ago", category: "Acquisition", description: "Acquired regional logistics firm for ₹220Cr", color: "#ef4444" },
  { id: "5", time: "5h ago", category: "Expansion", description: "Expanded into tier-2 cities with new SKUs", color: "#22c55e" },
  { id: "6", time: "8h ago", category: "Innovation", description: "Patent filed for sustainable packaging tech", color: "#3b82f6" },
  { id: "7", time: "12h ago", category: "Digital", description: "Launched D2C channel on Shopify", color: "#ec4899" },
  { id: "8", time: "1d ago", category: "Executive Signal", description: "CEO quoted on aggressive pricing strategy", color: "#94a3b8" },
];

export const MARKET_SHARE_TREND = [
  { month: "Jan", you: 28, a: 22, b: 18 },
  { month: "Feb", you: 29, a: 21, b: 17 },
  { month: "Mar", you: 30, a: 20, b: 17 },
  { month: "Apr", you: 31, a: 19, b: 16 },
  { month: "May", you: 32, a: 18, b: 16 },
  { month: "Jun", you: 33, a: 17, b: 15 },
];

export const ACTIVITY_INTENSITY = [
  { day: "Mon", intensity: 42 },
  { day: "Tue", intensity: 58 },
  { day: "Wed", intensity: 71 },
  { day: "Thu", intensity: 65 },
  { day: "Fri", intensity: 88 },
  { day: "Sat", intensity: 34 },
  { day: "Sun", intensity: 28 },
];

export const AI_FLOW_STEPS = [
  "Raw Data",
  "AI Processing",
  "Pattern Detection",
  "Strategic Insights",
  "Business Decisions",
];

export const AI_CAPABILITIES = [
  { title: "SWOT Analysis", desc: "Auto-generated competitive SWOT from live signals" },
  { title: "Trend Prediction", desc: "90-day market trajectory modeling" },
  { title: "Strategic Recommendations", desc: "Actionable next steps ranked by impact" },
  { title: "Market Risk Detection", desc: "Early warning system for volatility" },
  { title: "Opportunity Scoring", desc: "Prioritized growth signals by segment" },
  { title: "Growth Forecasting", desc: "Revenue impact modeling scenarios" },
];

export const OVERVIEW_FEATURES = [
  { id: "monitor", title: "Competitor Monitoring", description: "Track 360° competitor moves in real time", icon: "Radar", chartType: "line", data: spark(12, 40, 85) },
  { id: "alerts", title: "AI Strategic Alerts", description: "Get notified on signals that matter before they become threats", icon: "Bell", chartType: "bar", data: spark(8, 20, 70) },
  { id: "trends", title: "Market Trend Detection", description: "Identify emerging trends weeks before they peak", icon: "TrendingUp", chartType: "area", data: spark(10, 30, 90) },
  { id: "pricing", title: "Pricing Intelligence", description: "Monitor competitor pricing shifts across channels and geographies", icon: "DollarSign", chartType: "bar", data: spark(6, 50, 75) },
  { id: "predict", title: "Predictive Analytics", description: "AI models that forecast market direction with 94% accuracy", icon: "Brain", chartType: "line", data: spark(14, 55, 95) },
  { id: "dash", title: "Executive Dashboards", description: "Board-ready intelligence reports, auto-generated daily", icon: "LayoutDashboard", chartType: "area", data: spark(9, 35, 80) },
];

export const INDUSTRIES = [
  { id: "fmcg", label: "FMCG", name: "FMCG", hook: "Monitor 1,200+ FMCG brands in real time", icon: "🛒", data: spark(7, 40, 72) },
  { id: "fnb", label: "F&B", name: "Food & Beverage", hook: "Track launches, pricing, and channel shifts daily", icon: "🥤", data: spark(8, 35, 68) },
  { id: "agri", label: "Agriculture", name: "Agriculture", hook: "Commodity and input-cost intelligence", icon: "🌾", data: spark(6, 30, 65) },
  { id: "chem", label: "Chemicals", name: "Chemicals", hook: "Capacity, pricing, and regulatory signals", icon: "⚗️", data: spark(9, 45, 70) },
  { id: "cg", label: "Consumer", name: "Consumer Goods", hook: "Brand share and sentiment monitoring", icon: "🏷️", data: spark(10, 38, 74) },
  { id: "ind", label: "Industrial", name: "Industrial Manufacturing", hook: "Supply chain and capex signal tracking", icon: "🏭", data: spark(11, 42, 78) },
  { id: "pack", label: "Packaging", name: "Packaging", hook: "Material innovation and sustainability moves", icon: "📦", data: spark(7, 33, 66) },
  { id: "hc", label: "Healthcare", name: "Healthcare", hook: "Pipeline, trials, and market access intel", icon: "⚕️", data: spark(12, 48, 82) },
  { id: "retail", label: "Retail", name: "Retail", hook: "Omnichannel and promo intelligence", icon: "🏬", data: spark(8, 36, 71) },
  { id: "auto", label: "Automotive", name: "Automotive", hook: "EV, pricing, and regional launch tracking", icon: "🚗", data: spark(9, 44, 76) },
];

export const CAPABILITY_TABS = [
  { id: "monitor", label: "Real-Time Market Monitoring", title: "Live market signal coverage", insight: "Continuous ingestion from 40+ public and licensed sources with sub-hour refresh." },
  { id: "competitor", label: "AI Competitor Intelligence", title: "Competitive radar", insight: "Entity resolution links brands, subsidiaries, and SKU-level moves." },
  { id: "brief", label: "Executive Brief Automation", title: "Daily executive brief", insight: "Auto-generated board-ready summaries with cited sources." },
  { id: "signals", label: "Market Signal Detection", title: "Signal feed", insight: "Anomaly detection surfaces non-obvious inflection points." },
  { id: "trade", label: "Import/Export Intelligence", title: "Trade flow view", insight: "HS-code level import/export shifts by geography." },
  { id: "sentiment", label: "Customer Sentiment Analysis", title: "Sentiment gauge", insight: "NLP across reviews, social, and support forums." },
  { id: "dist", label: "Distributor Intelligence", title: "Channel network", insight: "Distributor coverage and conflict mapping." },
  { id: "price", label: "Pricing Benchmarking", title: "Price index comparison", insight: "Cross-channel price index vs. top 5 competitors." },
  { id: "invest", label: "Investment Tracking", title: "Capital flows", insight: "Funding, M&A, and capex announcements tracked." },
  { id: "strategy", label: "AI Strategy Recommendations", title: "Recommended actions", insight: "Ranked plays with expected revenue and risk impact." },
];

export const AGENTS = [
  { id: "comp", title: "Competitor Agent", desc: "Monitors 500+ competitor signals per day", status: "Active — Last run: 2m ago", workflow: ["Ingest feeds", "Rank signals", "Alert owners"], metric: "512 signals/day" },
  { id: "price", title: "Pricing Agent", desc: "Tracks price changes across 50+ channels", status: "Active — Last run: 5m ago", workflow: ["Scrape channels", "Normalize SKUs", "Flag deltas"], metric: "2.4k SKUs tracked" },
  { id: "trend", title: "Trend Agent", desc: "Analyzes 2M+ data points for emerging patterns", status: "Active — Last run: 1m ago", workflow: ["Cluster topics", "Score momentum", "Publish trends"], metric: "94% precision" },
  { id: "brief", title: "Executive Brief Agent", desc: "Auto-generates daily intelligence briefs", status: "Active — Last run: 8m ago", workflow: ["Summarize day", "Add citations", "Email execs"], metric: "6:00 AM daily" },
  { id: "risk", title: "Risk Monitoring Agent", desc: "24/7 early warning system", status: "Active — Last run: 30s ago", workflow: ["Watch thresholds", "Escalate risks", "Log audit"], metric: "0 critical open" },
];

export const DASHBOARD_KPIS = [
  { label: "Market Coverage", value: "2,400+", sub: "segments tracked" },
  { label: "Signals Today", value: "18,420", sub: "processed" },
  { label: "Active Competitors", value: "847", sub: "monitored" },
  { label: "Alerts Triggered", value: "23", sub: "last 24h" },
];

export const DASHBOARD_TREND = [
  { month: "Jan", signals: 4200, alerts: 12 },
  { month: "Feb", signals: 4800, alerts: 15 },
  { month: "Mar", signals: 5100, alerts: 18 },
  { month: "Apr", signals: 5600, alerts: 14 },
  { month: "May", signals: 6200, alerts: 20 },
  { month: "Jun", signals: 6800, alerts: 22 },
  { month: "Jul", signals: 7100, alerts: 19 },
  { month: "Aug", signals: 7500, alerts: 25 },
  { month: "Sep", signals: 8200, alerts: 28 },
  { month: "Oct", signals: 8800, alerts: 24 },
  { month: "Nov", signals: 9200, alerts: 30 },
  { month: "Dec", signals: 9800, alerts: 23 },
];

export const RADAR_DATA = [
  { subject: "Innovation", A: 88, B: 72 },
  { subject: "Pricing", A: 76, B: 84 },
  { subject: "Distribution", A: 92, B: 68 },
  { subject: "Brand", A: 85, B: 78 },
  { subject: "Digital", A: 90, B: 65 },
];

export const PIE_SHARE = [
  { name: "You", value: 33 },
  { name: "Comp A", value: 24 },
  { name: "Comp B", value: 18 },
  { name: "Others", value: 25 },
];

export const COMPETITOR_TABLE = [
  { name: "Competitor A", activity: "High", change: "+14%", region: "APAC" },
  { name: "Competitor B", activity: "Medium", change: "+6%", region: "EMEA" },
  { name: "Competitor C", activity: "High", change: "+22%", region: "India" },
  { name: "Competitor D", activity: "Low", change: "-3%", region: "NA" },
  { name: "Competitor E", activity: "Medium", change: "+9%", region: "LATAM" },
];

export const AI_RECOMMENDATIONS = [
  { title: "Pre-empt Q2 pricing", body: "Shift promotional calendar 2 weeks earlier in India tier-1." },
  { title: "Watch hiring cluster", body: "Engineering surge suggests platform launch in 60–90 days." },
  { title: "Defend modern trade", body: "Increase facings in top 3 chains where share slipped 1.2pts." },
];

export const METRICS = [
  { value: 10, suffix: "M+", label: "Market Signals Processed", icon: "Activity" },
  { value: 500, suffix: "K+", label: "Competitor Activities Tracked", icon: "Target" },
  { value: 95, suffix: "%", label: "Faster Strategic Insights", icon: "Zap" },
  { value: 24, suffix: "/7", label: "AI Monitoring", icon: "Clock" },
  { value: 40, suffix: "+", label: "Multi-Industry Intelligence", icon: "Layers" },
];

export const FALLBACK_INTELLIGENCE = {
  executiveSummary:
    "Competitive activity accelerated across APAC and India in the last 48 hours, led by pricing moves and SKU launches. Portfolio teams should prioritize defensive positioning in modern trade while monitoring hiring clusters in Bengaluru.",
  strategicInsight:
    "Based on 48-hour activity analysis, Competitor A is preparing a regional price war in Q2. Recommended action: pre-emptive promotional positioning in India and tightened distributor terms in tier-1 cities.",
  alerts: HERO_ALERTS.map((a) => `${a.icon} ${a.text}`),
  notifications: LIVE_TOASTS,
  recommendations: [
    "Accelerate innovation narrative in premium segment before Q2 price moves",
    "Hold EMEA list price; deploy targeted promo only in contested metros",
    "Expand D2C trial to counter competitor Shopify launch",
  ],
  riskSignal: "Raw material volatility may compress margins 120–180 bps in H1.",
  confidence: "High",
  generatedAt: new Date().toISOString(),
};

export const TESTIMONIALS = [
  { quote: "This platform replaced three separate tools and cut our insight time from 2 weeks to 4 hours.", role: "Strategy Director", company: "Global FMCG", initials: "SD" },
  { quote: "The AI alerts caught a competitor pricing shift 3 weeks before our sales team noticed it in the field.", role: "Head of Market Intelligence", company: "Industrial Manufacturer", initials: "MI" },
  { quote: "Our board now gets weekly AI-generated briefs. The quality matches what top-tier consulting firms deliver.", role: "CEO", company: "Regional Consumer Goods", initials: "CE" },
  { quote: "We use it as the single source of truth for competitive war rooms — Palantir-grade visibility without the implementation lag.", role: "Partner", company: "Strategy Consulting", initials: "PL" },
];

function spark(n, min, max) {
  const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  return Array.from({ length: n }, (_, i) => ({
    month: months[i % 12],
    value: min + Math.round((max - min) * (0.3 + (i / n) * 0.7)),
  }));
}

export const PLATFORM_KEYWORDS = [
  "AI competitive intelligence platform",
  "market intelligence software",
  "AI market research platform",
  "competitor monitoring AI",
  "strategic intelligence platform",
  "predictive market intelligence",
];

/** Public URL for the AI competitive intelligence product (nav + SEO). */
export const INTELLIGENCE_ROUTE = "/radar";
export const INTELLIGENCE_ROUTE_LABEL = "Radar";

export const PLATFORM_SEO = {
  title: "AI Competitive Intelligence Platform | Market Intelligence Software | InsightAxis",
  description:
    "Enterprise AI competitive intelligence platform for Fortune 500 teams. Real-time competitor monitoring AI, strategic intelligence, predictive market intelligence, and executive dashboards — powered by InsightAxis Intelligence.",
  path: INTELLIGENCE_ROUTE,
  keywords: PLATFORM_KEYWORDS,
};
