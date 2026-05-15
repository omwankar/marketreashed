/**
 * Builds Mordor sample-report generator input from a catalog market row so
 * segmentation, geography framing, sizing, and CAGR align with the card
 * data (valid, internally consistent sample figures).
 */

import {
  buildTopicSegmentRows,
  topicFromMarket,
  inferDomainFromTopic,
  normTopicKey,
} from "./marketTopicSegmentation.js";
import { buildSegmentationTableRows } from "./segmentHierarchy.js";

export { topicFromMarket, inferDomainFromTopic };

const REGION_WORLD = ["North America", "Europe", "Asia-Pacific", "Latin America", "Middle East & Africa"];

/** Map catalog GEO_REGIONS / labels → heatmap region names */
const REGION_ALIAS = {
  "north america": "North America",
  europe: "Europe",
  "asia pacific": "Asia-Pacific",
  "asia-pacific": "Asia-Pacific",
  latam: "Latin America",
  "latin america": "Latin America",
  mea: "Middle East & Africa",
  "middle east & africa": "Middle East & Africa",
};

const COUNTRY_TO_MACRO = {
  "united states": "North America",
  canada: "North America",
  mexico: "Latin America",
  brazil: "Latin America",
  china: "Asia-Pacific",
  india: "Asia-Pacific",
  japan: "Asia-Pacific",
  "south korea": "Asia-Pacific",
  indonesia: "Asia-Pacific",
  australia: "Asia-Pacific",
  germany: "Europe",
  "united kingdom": "Europe",
  france: "Europe",
  italy: "Europe",
  "saudi arabia": "Middle East & Africa",
};

function norm(s) {
  return String(s || "").trim().toLowerCase();
}

function resolveWorldRegion(label) {
  const k = norm(label);
  if (!k) return null;
  if (REGION_ALIAS[k]) return REGION_ALIAS[k];
  for (const [a, b] of Object.entries(REGION_ALIAS)) {
    if (k.includes(a)) return b;
  }
  return null;
}

function countryToMacro(country) {
  const k = norm(country);
  return COUNTRY_TO_MACRO[k] || null;
}

export function parseMarketValueBillions(value) {
  if (value == null) return null;
  const s = String(value).replace(/,/g, "");
  if (/T/i.test(s)) {
    const n = parseFloat(s.replace(/[$\sTt]/g, ""));
    return Number.isFinite(n) ? +(n * 1000).toFixed(2) : null;
  }
  const n = parseFloat(s.replace(/[$\sBb]/g, ""));
  return Number.isFinite(n) && n > 0 ? +n.toFixed(2) : null;
}

export function parseCagrPercent(cagr) {
  if (cagr == null) return null;
  const m = String(cagr).match(/([\d.]+)/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) && n > 0 && n < 100 ? +n.toFixed(1) : null;
}

function hashId(id) {
  let h = 0;
  const str = String(id || "x");
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function baseGlobalRegions(seed) {
  const base = [34, 27, 22, 10, 7];
  return REGION_WORLD.map((name, i) => ({
    name,
    share: Math.max(4, base[i] + ((seed + i * 3) % 5) - 2),
    intensity: i < 2 ? "High" : i < 4 ? "Medium" : "Low",
    cagr: +(5.5 + ((seed + i * 7) % 85) / 10).toFixed(1),
  }));
}

function applyRegionalBias(regions, focusName) {
  const idx = regions.findIndex((r) => r.name === focusName);
  if (idx < 0) return normalizeShares(regions);
  const boosted = regions.map((r, i) => ({
    ...r,
    share: r.share + (i === idx ? 18 : 0),
  }));
  return normalizeShares(boosted);
}

function applyCountryBias(regions, macroName) {
  const idx = regions.findIndex((r) => r.name === macroName);
  if (idx < 0) return normalizeShares(regions);
  const boosted = regions.map((r, i) => ({
    ...r,
    share: r.share + (i === idx ? 14 : 0),
  }));
  return normalizeShares(boosted);
}

function normalizeShares(rows) {
  const sum = rows.reduce((acc, r) => acc + r.share, 0);
  if (sum <= 0) return rows;
  return rows.map((r) => ({
    ...r,
    share: +((r.share / sum) * 100).toFixed(1),
  }));
}

/**
 * Restrict regional model + sizing to user-selected geographies (generator filters).
 * @param {Array<{ name: string, share: number, intensity: string, cagr: number }>} allRegions
 * @param {string[]} selectedLabels — labels from REGION_OPTIONS / form
 */
export function applyGeographyFilter(allRegions, selectedLabels) {
  const resolved = selectedLabels
    .map((g) => resolveWorldRegion(g) || g)
    .filter((name) => REGION_WORLD.includes(name));
  const unique = [...new Set(resolved.length ? resolved : REGION_WORLD)];
  const isSubset = unique.length < REGION_WORLD.length;

  let regions = allRegions.filter((r) => unique.includes(r.name));
  if (!regions.length) {
    regions = [allRegions[0]].filter(Boolean);
  }
  regions = normalizeShares(regions.map((r) => ({ ...r })));

  const globalShareSelected = isSubset
    ? allRegions.reduce((acc, r) => acc + (unique.includes(r.name) ? r.share : 0), 0)
    : 100;
  const scaleFactor = isSubset ? Math.max(0.06, Math.min(1, globalShareSelected / 100)) : 1;

  const largest = regions.reduce((a, b) => (a.share >= b.share ? a : b));
  const fastest = regions.reduce((a, b) => (Number(b.cagr) > Number(a.cagr) ? b : a));

  return {
    regions,
    geographies: unique,
    largestMarket: largest.name,
    fastestGrowingMarket: fastest.name,
    scaleFactor,
    isSubset,
  };
}

/** Topic-driven segmentation for the /generate form (no catalog row required). */
export function buildMordorSampleInputFromTopic(industry, opts = {}) {
  const name = String(industry || "").trim();
  const topicKey = normTopicKey(name);
  const domainId = inferDomainFromTopic(topicKey);
  const seed = topicKey.length * 17 + (opts.baseYear || 2025);

  const mockMarket = {
    id: `topic-${seed}`,
    name: /market$/i.test(name) ? name : `${name} Market`,
    topic: name,
    domainId,
    year: opts.baseYear || 2025,
    value: opts.value ?? "$10.0B",
    cagr: opts.cagr ?? "8.0%",
    geoScope: "Global",
  };

  const built = buildMordorSampleInputFromMarket(mockMarket, {
    selectedGeographies: opts.geographies,
  });
  let { segmentRows, segmentationTable } = built;
  const dimLimit = Number(opts.dimCount);
  if (Number.isFinite(dimLimit) && dimLimit >= 2 && dimLimit < segmentRows.length) {
    segmentRows = segmentRows.slice(0, dimLimit);
    segmentationTable = buildSegmentationTableRows(
      segmentRows.map((r) => ({ dimension: r.dimension, segments: r.segmentTree || [] })),
    );
  }
  return {
    ...built,
    segmentRows,
    segmentationTable,
    dimensions: segmentRows.map((r) => r.dimension),
    industry: name.replace(/\s+Market$/i, "").trim() || name,
    baseYear: opts.baseYear ?? built.baseYear,
    forecastEndYear: opts.forecastEndYear ?? built.forecastEndYear,
    geographies: built.geographies,
    audience: opts.audience || built.audience,
    geographyScopeNote: built.geographyScopeNote,
    scaleFactor: built.scaleFactor,
  };
}

export function buildMordorSampleInputFromMarket(market, options = {}) {
  const industry = String(market.name || "Market").replace(/\s+Market$/i, "").trim() || "Market";
  const baseYear = Number(market.year) || 2025;
  const forecastEndYear = baseYear + 6;
  const seed = hashId(market.id) + industry.length * 3;

  const { majorPlayers, segmentRows, segmentationTable } = buildTopicSegmentRows(market, seed);

  let vb = parseMarketValueBillions(market.value);
  const cg = parseCagrPercent(market.cagr);

  let regions = baseGlobalRegions(seed);
  let largestMarket = regions.reduce((a, b) => (a.share >= b.share ? a : b)).name;
  let fastestGrowingMarket = regions.reduce((a, b) => (a.cagr >= b.cagr ? a : b)).name;
  let geographies = [...REGION_WORLD];
  let studyNote = "";

  if (market.geoScope === "Regional" && market.region) {
    const rn = resolveWorldRegion(market.region);
    if (rn) {
      regions = applyRegionalBias(baseGlobalRegions(seed), rn);
      largestMarket = rn;
      studyNote = ` This sample frames global demand context while emphasizing ${market.region} as the primary regional scope.`;
      geographies = [market.region, "Global benchmark (all regions)"];
    }
  } else if (market.geoScope === "Country" && market.country) {
    const macro = countryToMacro(market.country) || "North America";
    regions = applyCountryBias(baseGlobalRegions(seed), macro);
    largestMarket = market.country;
    fastestGrowingMarket = regions.reduce((a, b) => (a.cagr >= b.cagr ? a : b)).name;
    studyNote = ` This edition focuses on ${market.country}; global regions below provide benchmark context for the same category.`;
    geographies = [market.country, `${macro} (macro region)`, "Global benchmark"];
  }

  let scaleFactor = 1;
  let geographyScopeNote = "";
  const userGeos = options.selectedGeographies;
  if (Array.isArray(userGeos) && userGeos.length > 0 && userGeos.length < REGION_WORLD.length && market.geoScope === "Global") {
    const applied = applyGeographyFilter(regions, userGeos);
    regions = applied.regions;
    geographies = applied.geographies;
    largestMarket = applied.largestMarket;
    fastestGrowingMarket = applied.fastestGrowingMarket;
    scaleFactor = applied.scaleFactor;
    geographyScopeNote = `Scoped to ${geographies.join(", ")}.`;
    studyNote += ` This sample edition covers ${geographies.join(", ")} only; regional revenue shares are re-based to 100% across the selected geographies and market sizing reflects the corresponding share of the global market.`;
    if (vb != null) {
      vb = +(vb * scaleFactor).toFixed(2);
    }
  }

  return {
    industry,
    baseYear,
    forecastEndYear,
    geographies,
    dimensions: segmentRows.map((r) => r.dimension),
    audience: "Enterprises",
    segmentRows,
    segmentationTable,
    baseValueBillions: vb,
    cagrPercent: cg,
    largestMarket,
    fastestGrowingMarket,
    majorPlayersOverride: majorPlayers,
    worldRegionsOverride: regions,
    studyNote,
    scaleFactor,
    geographyScopeNote,
  };
}
