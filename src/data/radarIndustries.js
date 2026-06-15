/** 10 industry verticals — aligned with site /domains */
export const RADAR_INDUSTRIES = [
  { id: "fnb", label: "Food & Beverage", icon: "🍽️", desc: "Food, beverage, and nutrition markets" },
  { id: "consumer", label: "Consumer Goods", icon: "🛒", desc: "Retail, lifestyle, and durable goods" },
  { id: "fmcg", label: "FMCG", icon: "🏪", desc: "Fast-moving consumer goods and shelf competition" },
  { id: "healthcare", label: "Healthcare", icon: "⚕️", desc: "Pharma, medtech, and life sciences" },
  { id: "industrial", label: "Industrial", icon: "🏭", desc: "Manufacturing, automation, and supply chain" },
  { id: "technology", label: "Technology", icon: "💻", desc: "Software, semiconductors, and IT services" },
  { id: "energy", label: "Energy & Utilities", icon: "⚡", desc: "Renewables, oil & gas, and power" },
  { id: "automotive", label: "Automotive", icon: "🚗", desc: "EV, mobility, and auto components" },
  { id: "chemicals", label: "Chemicals", icon: "🧪", desc: "Specialty chemicals and materials" },
  { id: "finance", label: "Financial Services", icon: "🏦", desc: "Banking, insurance, and fintech" },
];

export const DEFAULT_RADAR_INDUSTRY_ID = "technology";

export function getRadarIndustry(id) {
  return RADAR_INDUSTRIES.find((i) => i.id === id) || RADAR_INDUSTRIES.find((i) => i.id === DEFAULT_RADAR_INDUSTRY_ID);
}

const STORAGE_KEY = "insightaxis_radar_industry";

export function readStoredRadarIndustry() {
  try {
    const id = localStorage.getItem(STORAGE_KEY);
    if (id && RADAR_INDUSTRIES.some((i) => i.id === id)) return id;
  } catch {
    /* private mode */
  }
  return DEFAULT_RADAR_INDUSTRY_ID;
}

export function writeStoredRadarIndustry(id) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}
