import { useEffect, useMemo, useRef, useState } from "react";
import {
  useSEO,
  buildBreadcrumbSchema,
  buildReportSchema,
  buildFaqSchema,
} from "../hooks/useSEO.js";
import { slugify } from "../utils/slugify.js";

// ─────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────

const BRAND = "InsightAxis Intelligence";
const GEMINI_MODEL = "gemini-2.0-flash";
const REGION_OPTIONS = ["North America", "Europe", "Asia-Pacific", "Latin America", "Middle East & Africa"];
const AUDIENCE_OPTIONS = ["Investors", "Enterprises", "Startups", "Consultants", "Government"];
const DEFAULT_DIMENSIONS = ["Product Type", "Ingredient / Component", "Form", "Distribution Channel"];

// Mordor-style report palette (light document on light bg)
const C = {
  primary: "#0B3D5C", // dark navy/teal headers
  primaryLight: "#1A6B91",
  accent: "#1A6FE8", // blue accent for bars
  accentLight: "#5C9CF0",
  alert: "#E0552E", // orange CTA borders
  alertSoft: "#FFF3EE",
  green: "#2E8B57",
  red: "#C2492A",
  surface: "#FFFFFF",
  surfaceAlt: "#F4F7FB",
  surfaceSub: "#E8EEF5",
  border: "#D6DEE8",
  borderStrong: "#B8C4D4",
  text: "#1A2333",
  textMuted: "#5A6678",
  textFaint: "#8A96A8",
};

const DONUT_PALETTE = [C.primary, C.accent, C.accentLight, "#7BAFD4", "#B8CDDF", "#E0E7EF"];

// ─────────────────────────────────────────────────────────────────
// GEMINI + DATA SHAPE
// ─────────────────────────────────────────────────────────────────

async function generateGeminiText(prompt, maxOutputTokens = 4000) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing Gemini API key");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens, temperature: 0.55 },
      }),
    },
  );
  if (!res.ok) throw new Error("Gemini request failed");
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
}

function buildMordorPrompt(input) {
  const {
    industry, baseYear, forecastEndYear, geographies, dimensions, audience,
  } = input;
  const currentYear = baseYear + 1;
  return `You are a senior market research analyst at a Mordor-Intelligence-class firm. Produce a comprehensive market research report for: "${industry} Market".

Audience: ${audience}.
Base year: ${baseYear}. Forecast: ${currentYear} to ${forecastEndYear}.
Geographies in scope: ${geographies.join(", ")}.
Segmentation dimensions to analyze (${dimensions.length}): ${dimensions.join(", ")}.

Respond ONLY with valid JSON (no markdown, no preamble) matching exactly this shape. Use real-sounding company names and plausible figures. Keep all paragraph fields between 150 and 220 words.

{
  "title": "${industry} Market Size & Share Analysis - Growth Trends and Forecast (${currentYear} - ${forecastEndYear})",
  "executive": "one paragraph executive description mentioning the ${dimensions.length} segmentation dimensions (${dimensions.join(", ")}) and geography coverage",
  "marketSize": {
    "baseYear": ${baseYear},
    "currentYear": ${currentYear},
    "forecastYear": ${forecastEndYear},
    "baseValue": numeric USD billion at base year,
    "currentValue": numeric USD billion at current year,
    "forecastValue": numeric USD billion at forecast year,
    "cagr": numeric CAGR % between current and forecast year,
    "studyPeriod": "${baseYear}-${forecastEndYear}",
    "fastestGrowingMarket": "region name",
    "largestMarket": "region name",
    "marketConcentration": "Low" | "Medium" | "High",
    "majorPlayers": [array of 6-8 real company names]
  },
  "takeaways": [array of 5 strings, one per segmentation dimension + geography, e.g. "By Product Type: <Leader> leads with X.X% revenue share in ${currentYear}; <Fastest> grows at X.X% CAGR through ${forecastEndYear}."],
  "drivers": [
    array of 5-6 objects: {
      "name": "short driver name (max 8 words)",
      "impact": "+X.X%",
      "region": "Global | <region>",
      "timeline": "Short-term" | "Medium-term" | "Long-term",
      "paragraph": "150-200 word detailed explanation"
    }
  ],
  "restraints": [
    array of 4 objects: {
      "name": "short restraint name",
      "impact": "-X.X%",
      "region": "Global | <region>",
      "timeline": "Short-term" | "Medium-term" | "Long-term",
      "paragraph": "150-200 word detailed explanation"
    }
  ],
  "segments": [
    array of ${dimensions.length} objects (one per dimension: ${dimensions.join(", ")}), each: {
      "dimension": "${dimensions[0]}",
      "headline": "By <Dimension>: <Specific Leader> Holds the Largest Share",
      "leader": { "name": "segment name", "share": numeric %, "paragraph": "150-200 word paragraph explaining why this segment leads" },
      "fastest": { "name": "segment name", "cagr": numeric %, "paragraph": "150-200 word paragraph explaining why this segment is fastest growing" },
      "subSegments": [array of 5-7 sub-segment name strings]
    }
  ],
  "geography": {
    "regions": [
      array of 5 objects (one per: North America, Europe, Asia-Pacific, Latin America, Middle East & Africa), each: {
        "name": "region name",
        "share": numeric % share of global market,
        "intensity": "High" | "Medium" | "Low",
        "cagr": numeric %
      }
    ],
    "largestParagraph": "180-220 words on the largest region and why it leads",
    "fastestParagraph": "180-220 words on the fastest growing region and growth drivers",
    "matureParagraph": "150-180 words on mature markets overview",
    "emergingParagraph": "150-180 words on emerging markets overview"
  },
  "competitive": {
    "fragmentationParagraph": "180-220 word paragraph on market fragmentation level",
    "strategiesParagraph": "180-220 word paragraph on leading manufacturers' strategies",
    "industryLeaders": [array of exactly 5 top company names],
    "concentration": numeric 0-1 (0 = fragmented, 1 = consolidated),
    "extendedProfiles": [array of 15-18 company name strings]
  },
  "developments": [
    array of 5 objects: { "date": "Month YYYY", "company": "Company name", "description": "2-3 sentences (40-60 words) describing the announcement" }
  ],
  "scope": {
    "${dimensions[0]}": [array of 5-7 sub-segment name strings],
    ${dimensions.slice(1).map((d) => `"${d}": [array of 5-7 sub-segment name strings]`).join(",\n    ")},
    "Geography": ${JSON.stringify(geographies)}
  },
  "faqs": [
    array of 5 objects: { "q": "question", "a": "70-110 word answer" } covering: projected value by ${forecastEndYear}, largest region's revenue share, fastest growing segment, fastest growing region's CAGR, and one substitution / competitive dynamic question
  ]
}`;
}

// Local synthesizer used when the API key is missing or the call fails.
function buildLocalMordorReport(input) {
  const { industry, baseYear, forecastEndYear, geographies, dimensions } = input;
  const currentYear = baseYear + 1;
  const seed = industry.length * 7 + baseYear;
  const baseValue = 18 + (seed % 60);
  const cagr = 6.5 + (seed % 8);
  const years = forecastEndYear - currentYear;
  const forecastValue = +(baseValue * 1.06 * Math.pow(1 + cagr / 100, years)).toFixed(1);
  const currentValue = +(baseValue * 1.06).toFixed(1);

  const segments = dimensions.map((dim, i) => {
    const leaderShare = 32 + ((seed + i * 7) % 18);
    const fastestCagr = 9 + ((seed + i * 13) % 11);
    const leaderName = `${dim.split(/[\s/]+/)[0]} Leader ${String.fromCharCode(65 + i)}`;
    const fastestName = `${dim.split(/[\s/]+/)[0]} Emerging ${String.fromCharCode(88 - i)}`;
    return {
      dimension: dim,
      headline: `By ${dim}: ${leaderName} Holds the Largest Share`,
      leader: {
        name: leaderName,
        share: leaderShare,
        paragraph: `${leaderName} leads the ${industry.toLowerCase()} market by ${dim.toLowerCase()} with an estimated ${leaderShare}% share of ${currentYear} revenues. Established distribution, brand trust, and a broad product portfolio give incumbent operators a structural advantage in this segment. Procurement teams favor proven suppliers for compliance, traceability, and scalability — particularly in ${geographies[0] || "North America"} and ${geographies[1] || "Europe"} where regulatory expectations are highest. The leading segment also benefits from premium pricing power: scale enables marketing reinvestment, which in turn supports shelf and digital visibility across major retail and B2B channels. Over the forecast horizon, the leader is expected to defend share through portfolio refresh, sustainable sourcing claims, and selective partnerships that extend reach into adjacent categories. Margin durability remains supported by efficient supply chains, mix management, and selective premiumization that offsets input volatility.`,
      },
      fastest: {
        name: fastestName,
        cagr: fastestCagr,
        paragraph: `${fastestName} is the fastest growing ${dim.toLowerCase()} segment in the ${industry.toLowerCase()} market, expanding at an estimated ${fastestCagr}% CAGR through ${forecastEndYear}. Adoption is being pulled by a combination of changing buyer preferences, technology improvements, and incentive programs in priority geographies. Specialty retailers and direct-to-consumer channels are accelerating awareness while category-leading brands invest in claims around clean ingredients, traceable supply chains, and improved performance. Cost-position has improved as production scale increases and value chains formalize, narrowing the price gap with the leading segment. Through ${forecastEndYear}, we expect the segment to continue to outpace the broader category as cross-functional buyers — operations, sustainability, and procurement — converge on the same product specifications, and as private-label entrants accelerate price-elastic adoption in mid-market accounts.`,
      },
      subSegments: [
        `Premium ${dim}`,
        `Mid-tier ${dim}`,
        `Value ${dim}`,
        `Specialty ${dim}`,
        `Emerging ${dim}`,
        `Private Label ${dim}`,
      ],
    };
  });

  const regions = REGION_OPTIONS.map((name, i) => {
    const baseShare = [34, 27, 25, 8, 6][i] || 5;
    return {
      name,
      share: baseShare + ((seed + i * 3) % 4) - 2,
      intensity: i < 2 ? "High" : i < 3 ? "High" : i < 4 ? "Medium" : "Low",
      cagr: +(5 + (seed + i * 5) % 9).toFixed(1),
    };
  });

  return {
    title: `${industry} Market Size & Share Analysis - Growth Trends and Forecast (${currentYear} - ${forecastEndYear})`,
    executive: `The ${industry.toLowerCase()} market is segmented by ${dimensions.join(", ")}, and Geography (${geographies.join(", ")}). The report sizes the market from ${baseYear} through ${forecastEndYear}, quantifies segment-level share and CAGR, profiles key manufacturers and emerging entrants, and identifies the drivers, restraints, and opportunities expected to shape demand across the forecast horizon.`,
    marketSize: {
      baseYear, currentYear, forecastYear: forecastEndYear,
      baseValue, currentValue, forecastValue,
      cagr: +cagr.toFixed(1),
      studyPeriod: `${baseYear}-${forecastEndYear}`,
      fastestGrowingMarket: "Asia-Pacific",
      largestMarket: "North America",
      marketConcentration: "Medium",
      majorPlayers: [
        `${industry.split(" ")[0] || "Apex"} Holdings`,
        "Nexora Corp",
        "Vantage Group",
        "Meridian Co.",
        "Orion Partners",
        "Summit Brands",
        "Astral Industries",
        "Helios Systems",
      ],
    },
    takeaways: [
      ...dimensions.slice(0, 4).map((d, i) => `By ${d}: ${segments[i].leader.name} leads with ${segments[i].leader.share}% revenue share in ${currentYear}; ${segments[i].fastest.name} grows at ${segments[i].fastest.cagr}% CAGR through ${forecastEndYear}.`),
      `By Geography: North America accounts for ~${regions[0].share}% of ${currentYear} revenue; Asia-Pacific is the fastest growing region at ${regions[2].cagr}% CAGR through ${forecastEndYear}.`,
    ],
    drivers: [
      { name: "Rising health & wellness awareness", impact: "+2.8%", region: "Global", timeline: "Short-term", paragraph: `Consumer preference for ${industry.toLowerCase()} products that align with documented health, sustainability, and traceability claims continues to expand. Buyers across ${geographies.slice(0, 2).join(" and ")} are increasingly willing to pay premiums for verified positioning, accelerating premiumization across both retail and foodservice channels. Manufacturers are responding with clean-label reformulations, third-party certifications, and clearer on-pack communication. The shift is reinforced by influencer and social-media discovery, where short-form video amplifies brand stories and seeds adoption in priority urban demographics. As awareness deepens, demand spreads from early adopters into mainstream buyers — pulling private-label entrants into the category and broadening the addressable base. Through ${forecastEndYear}, this driver is expected to remain the single largest contributor to category growth, particularly in mature markets where buyer literacy is highest and where category-leading brands can defend pricing through narrative consistency and packaging investment.` },
      { name: "Distribution channel digitization", impact: "+2.1%", region: "Global", timeline: "Medium-term", paragraph: `Direct-to-consumer storefronts, marketplace integrations, and quick-commerce partnerships are reshaping the route-to-market for ${industry.toLowerCase()} brands. Online channels offer lower trial friction for new SKUs, richer first-party data on buyer behavior, and faster feedback loops on pricing and assortment. Established players are investing in headless commerce, subscription mechanics, and loyalty programs that improve repeat rates and customer lifetime value. Emerging entrants leverage the same infrastructure to bypass traditional retail gatekeepers, accelerating product-market fit and category penetration. Across the forecast horizon, digital channels are expected to account for an outsized share of incremental growth, particularly in ${geographies[0] || "North America"} and parts of Asia-Pacific where logistics density supports profitable economics. Brands that successfully integrate online and offline data into a unified commerce stack will capture disproportionate value as buyer journeys continue to fragment across touchpoints.` },
      { name: "Supply chain regionalization", impact: "+1.6%", region: geographies[0] || "Global", timeline: "Medium-term", paragraph: `Geopolitical complexity, freight volatility, and post-pandemic resilience priorities are pulling manufacturers to regionalize sourcing and contract manufacturing footprints. For the ${industry.toLowerCase()} category, this reduces lead times, improves on-shelf availability, and limits exposure to single-country disruptions. Capacity investments are flowing into ${geographies[1] || "Europe"} and ${geographies[2] || "Asia-Pacific"}, supported by local incentives and customer demand for shorter, verifiable supply chains. Cost-to-serve in regionalized models tends to be moderately higher in the short term but improves total landed cost when freight and disruption risk are normalized. Through ${forecastEndYear}, expect continued additions to regional manufacturing capacity, paired with multi-sourcing strategies for key inputs. Operators that build resilient, traceable, and ESG-aligned supply chains stand to win larger institutional accounts and command modest pricing premiums in B2B contracts.` },
      { name: "Investment & funding flows", impact: "+1.3%", region: "Global", timeline: "Short-term", paragraph: `Venture, strategic, and growth equity capital continues to flow into the ${industry.toLowerCase()} category, supporting both new entrants and incumbent capability expansion. Investor interest is concentrated in product platforms with defensible IP, sustainability credentials, and clear unit economics. M&A activity is rising as scale players acquire challenger brands to extend portfolio coverage, accelerate category entry, and absorb premium customer cohorts. Valuations have moderated from cycle highs but remain supportive for category-defining assets. Capital is also funding category education, accelerating broader buyer awareness and pulling adjacent retailers into category-leading partnerships. The funding environment is expected to remain constructive through the forecast horizon, particularly for brands with demonstrable contribution margin, retention, and category authority.` },
      { name: "Regulatory clarification & labeling", impact: "+0.9%", region: "Europe & North America", timeline: "Long-term", paragraph: `Evolving regulatory guidance on ingredient disclosure, claims substantiation, and product safety is increasing buyer confidence and compressing compliance variability across the ${industry.toLowerCase()} market. Standardized labeling supports cross-border trade, accelerates retailer onboarding, and reduces consumer skepticism for emerging product formats. While the short-term cost of compliance modestly raises operating overhead, the long-term effect is positive — clearer rules favor scaled operators with documented quality systems and traceable supply chains, raising the barrier to entry for low-quality imports and accelerating consolidation in fragmented sub-categories. Across the forecast horizon, expect harmonization between major jurisdictions to expand, particularly in ${geographies[0] || "North America"} and the European Union, where category-leading brands are already aligning to anticipated rule sets.` },
    ],
    restraints: [
      { name: "Input cost volatility", impact: "-2.1%", region: "Global", timeline: "Short-term", paragraph: `Volatility in key raw materials, freight, and packaging continues to pressure margins across the ${industry.toLowerCase()} value chain. Inflation in protein, grain, energy, and labor has driven multiple rounds of pricing actions, with consumers in mature markets showing intermittent price sensitivity at premium tiers. Smaller brands without scale-driven procurement advantages absorb a disproportionate share of input shocks, accelerating consolidation toward larger operators with hedging programs and diversified supplier bases. Brands are responding through SKU rationalization, mix management toward higher-margin formats, and selective trade promotion. Through ${forecastEndYear}, input volatility is expected to remain a structural risk; operators with strong commercial discipline, real-time cost-to-serve visibility, and dynamic pricing capabilities will be best positioned to defend gross margin while preserving volume growth.` },
      { name: "Regulatory complexity & compliance cost", impact: "-1.2%", region: "Europe & North America", timeline: "Medium-term", paragraph: `Tightening rules on ingredient claims, labeling accuracy, environmental disclosure, and product safety raise compliance overhead for ${industry.toLowerCase()} operators — particularly mid-sized brands without dedicated regulatory teams. Cross-border operators face the additional friction of harmonizing documentation across jurisdictions where requirements diverge in detail even when intent is aligned. Compliance investments include legal review, supplier audits, traceability systems, and analytics for substantiating claims. While these costs ultimately favor higher-quality category structure, they can suppress short-term innovation velocity for smaller players. The restraint is most pronounced in Europe and select North American states with stricter ingredient and packaging rules, and is expected to remain a moderating force on margin expansion through the forecast horizon.` },
      { name: "Consumer price sensitivity", impact: "-1.0%", region: "Emerging markets", timeline: "Short-term", paragraph: `Sustained inflation in food, fuel, and shelter has tightened discretionary budgets in many emerging-market households, limiting trade-up to premium ${industry.toLowerCase()} formats. Buyers are increasingly comparison-shopping across channels, gravitating toward private-label alternatives or smaller pack sizes that preserve trial without committing full basket spend. Brands with limited price elasticity flexibility lose share to value-tier competition, particularly in modern trade where private label is most visible. The restraint is partially offset by selective premiumization in higher-income cohorts, but in aggregate it modestly slows category growth and weighs on margin in price-sensitive markets. Operators that invest in entry-level SKUs, pack-price architecture, and clear value communication mitigate the downside while maintaining brand equity at premium tiers.` },
      { name: "Substitution from adjacent categories", impact: "-0.8%", region: "Global", timeline: "Long-term", paragraph: `Adjacent categories — ranging from functional alternatives to digital experiences — increasingly compete for the same buyer wallet and attention as core ${industry.toLowerCase()} products. Substitution intensifies as adjacent solutions match or exceed on convenience, perceived efficacy, and lifestyle fit, even when not directly equivalent. Brands that frame their narrative narrowly around legacy category cues are most exposed. The restraint is mitigated by R&D investments that extend functional benefits, partnerships with adjacent ecosystems, and clearer differentiation around heritage, trust, and verified outcomes. Through ${forecastEndYear}, expect continued blurring of category boundaries; the operators that recast their proposition around outcomes (e.g. energy, recovery, indulgence) rather than legacy category labels will best defend share against substitutes.` },
    ],
    segments,
    geography: {
      regions,
      largestParagraph: `${regions[0].name} remains the largest geographic market for ${industry.toLowerCase()}, accounting for approximately ${regions[0].share}% of global revenues in ${currentYear}. Category maturity, well-developed retail infrastructure, high per-capita consumption, and consistent investment by category-leading brands all reinforce regional leadership. Premiumization and digital channel adoption continue to fund growth even where category penetration is already high; consumers in the region trade up toward verified, sustainable, and clean-label offerings, supporting margin expansion despite slower volume growth. Regulatory clarity and category leadership by brands such as ${segments[0]?.leader.name} or its peers also reduce execution risk for international entrants. Expect ${regions[0].name} to retain leadership through the forecast horizon, with mid-single-digit growth supported by mix and innovation more than by raw volume gains.`,
      fastestParagraph: `${regions[2].name} is the fastest growing region in the ${industry.toLowerCase()} market, expanding at an estimated ${regions[2].cagr}% CAGR through ${forecastEndYear}. Urbanization, expanding middle-class buyers, modern retail penetration, and aggressive investment by both regional incumbents and global brands are converging to accelerate category formation. Local manufacturing capacity, government incentives for category development, and the rapid adoption of digital channels in priority markets (China, India, Indonesia, Vietnam) compound growth. The region also benefits from a younger consumer base with rapidly evolving brand preferences, supporting trial of newer formats. Expect continued capital inflows, additional regional production capacity, and increased competitive intensity over the forecast horizon as global incumbents consolidate regional positions.`,
      matureParagraph: `Mature markets — ${regions[0].name} and ${regions[1].name} — exhibit slower volume growth but higher per-capita revenue and stronger premiumization tailwinds. Buyers in these markets prioritize verified claims, sustainable sourcing, and brand provenance, supporting margin expansion through mix even where overall category volumes plateau. Category leadership tends to be entrenched, with M&A and platform extensions serving as the primary route to share gains. Innovation cycles are shorter than in emerging markets but more selective, focused on incremental functional benefits, packaging sustainability, and digital commerce integration. These markets remain commercially attractive due to high absolute revenue contribution, established distribution, and the willingness of consumers to absorb pricing actions in support of trusted brands.`,
      emergingParagraph: `Emerging markets — across Asia-Pacific, Latin America, and parts of Middle East & Africa — represent the highest growth opportunity for ${industry.toLowerCase()} operators willing to invest in distribution, brand-building, and locally relevant product formats. Per-capita consumption is materially below mature-market levels but is rising as urbanization, modern retail, and digital channel access converge. Local manufacturing, partnerships with regional distributors, and tailored pricing architecture are common entry strategies. Risk factors include regulatory variability, FX exposure, and channel fragmentation, but the long-run reward is access to a structurally larger addressable market. Expect emerging-market revenue mix for category-leading global brands to continue rising over the forecast horizon.`,
    },
    competitive: {
      fragmentationParagraph: `The ${industry.toLowerCase()} market exhibits a ${"medium"} level of fragmentation in ${currentYear}, with the top five operators accounting for an estimated 35-45% of global revenue. Long-tail share is held by regional specialists, private-label manufacturers, and rapidly scaling challenger brands that win in specific channels or sub-segments. Fragmentation is most pronounced in emerging markets and in newer sub-categories where category-leading brands have yet to consolidate share. In contrast, mature sub-categories within ${regions[0].name} and ${regions[1].name} display higher concentration as scale players defend distribution and brand equity through marketing reinvestment and selective acquisitions. The structural trajectory through ${forecastEndYear} points to gradual consolidation as scale, supply chain, and regulatory advantages accrue to larger operators, while specialist challengers continue to harvest premium niches.`,
      strategiesParagraph: `Category-leading manufacturers compete on a combination of brand equity, distribution depth, R&D investment, sustainability credentials, and selective M&A. Portfolio strategy increasingly emphasizes premium and functional positioning over commodity volume, supported by ESG-aligned messaging and verifiable supply chain claims. Capital deployment is balanced between organic capability (capacity, e-commerce, R&D talent) and acquisition of high-growth challenger brands that extend portfolio reach. Strategic partnerships across the value chain — ingredient suppliers, packaging innovators, and digital commerce platforms — accelerate route-to-market and reduce dependency on legacy retail gatekeepers. Pricing strategies emphasize structured premiumization and channel-specific pack-price architecture, supported by data-driven trade promotion. Through the forecast horizon, expect continued investment in digital commerce capability, supply chain regionalization, and emerging-market footprint expansion as the principal competitive levers.`,
      industryLeaders: [
        `${industry.split(" ")[0] || "Apex"} Holdings`,
        "Nexora Corp",
        "Vantage Group",
        "Meridian Co.",
        "Orion Partners",
      ],
      concentration: 0.42,
      extendedProfiles: [
        "Astral Capital", "Summit Brands", "Helios Systems", "Continuum Foods", "Pioneer Labs", "Atlas Solutions",
        "Horizon Dynamics", "Beacon Group", "Northline Industries", "Vertex Partners", "Halcyon Brands", "Lighthouse Co.",
        "Aurora Holdings", "Crescent Corp", "Polaris Brands", "Sentinel Group",
      ],
    },
    developments: [
      { date: `April ${baseYear}`, company: `${industry.split(" ")[0] || "Apex"} Holdings`, description: `Launched a next-generation ${industry.toLowerCase()} portfolio targeting premium retail accounts in ${regions[0].name}, with verifiable sourcing and an integrated subscription channel. Initial distribution covers 3,000+ doors across modern trade and specialty retail.` },
      { date: `February ${baseYear}`, company: "Nexora Corp", description: `Announced acquisition of a regional challenger brand to extend Asia-Pacific footprint and accelerate category-leading direct-to-consumer capability. Deal value not disclosed; integration expected to complete within 9 months.` },
      { date: `December ${baseYear - 1}`, company: "Vantage Group", description: `Opened a new manufacturing facility in ${regions[2].name} to reduce import dependency and support faster product launches in priority emerging markets. Capacity additions expected to support 18-month forecast demand.` },
      { date: `October ${baseYear - 1}`, company: "Meridian Co.", description: `Partnered with a major quick-commerce platform across ${regions[0].name} to offer 30-minute delivery for category-leading SKUs and accelerate first-party data collection on buyer behavior.` },
      { date: `August ${baseYear - 1}`, company: "Orion Partners", description: `Closed a $180M Series E to fund category expansion, capacity investments, and selective acquisitions across the ${industry.toLowerCase()} portfolio. Strategic investors include two top-tier consumer brands.` },
    ],
    scope: {
      ...Object.fromEntries(dimensions.map((d, i) => [d, segments[i].subSegments])),
      Geography: geographies,
    },
    faqs: [
      { q: `What is the projected market value by ${forecastEndYear}?`, a: `The ${industry.toLowerCase()} market is projected to reach approximately USD ${forecastValue.toFixed(1)} billion by ${forecastEndYear}, growing at an estimated ${cagr.toFixed(1)}% CAGR from USD ${currentValue.toFixed(1)} billion in ${currentYear}. Growth is supported by premiumization, distribution expansion, and emerging-market formation.` },
      { q: `Which region accounts for the largest revenue share?`, a: `${regions[0].name} accounts for approximately ${regions[0].share}% of global ${industry.toLowerCase()} revenues in ${currentYear}, supported by category maturity, retail infrastructure, and consistent brand investment. Expect the region to retain leadership through ${forecastEndYear}, with mid-single-digit growth driven mainly by mix and innovation.` },
      { q: `Which segment is expected to grow fastest?`, a: `${segments[0].fastest.name} is expected to be among the fastest growing segments at approximately ${segments[0].fastest.cagr}% CAGR through ${forecastEndYear}, supported by changing buyer preferences and accelerating digital channel adoption.` },
      { q: `Which region is the fastest growing?`, a: `${regions[2].name} is expected to grow at approximately ${regions[2].cagr}% CAGR through ${forecastEndYear}, driven by urbanization, modern retail penetration, and aggressive investment by both regional and global incumbents.` },
      { q: `Why is the leading segment defending share against challengers?`, a: `Brand equity, distribution depth, scale-driven cost position, and consistent reinvestment in product and marketing all reinforce the leader's position. Challenger brands continue to harvest premium niches but face structural disadvantages in pricing and shelf access.` },
    ],
  };
}

function normalizeReport(payload, fallback) {
  const r = { ...fallback, ...payload };
  if (!Array.isArray(r.takeaways) || !r.takeaways.length) r.takeaways = fallback.takeaways;
  if (!Array.isArray(r.drivers) || !r.drivers.length) r.drivers = fallback.drivers;
  if (!Array.isArray(r.restraints) || !r.restraints.length) r.restraints = fallback.restraints;
  if (!Array.isArray(r.segments) || !r.segments.length) r.segments = fallback.segments;
  if (!Array.isArray(r.developments) || !r.developments.length) r.developments = fallback.developments;
  if (!Array.isArray(r.faqs) || !r.faqs.length) r.faqs = fallback.faqs;
  r.marketSize = { ...fallback.marketSize, ...(payload.marketSize || {}) };
  r.geography = { ...fallback.geography, ...(payload.geography || {}) };
  if (!Array.isArray(r.geography.regions) || !r.geography.regions.length) r.geography.regions = fallback.geography.regions;
  r.competitive = { ...fallback.competitive, ...(payload.competitive || {}) };
  if (!Array.isArray(r.competitive.industryLeaders) || !r.competitive.industryLeaders.length) r.competitive.industryLeaders = fallback.competitive.industryLeaders;
  if (!Array.isArray(r.competitive.extendedProfiles) || !r.competitive.extendedProfiles.length) r.competitive.extendedProfiles = fallback.competitive.extendedProfiles;
  r.scope = { ...fallback.scope, ...(payload.scope || {}) };
  return r;
}

// ─────────────────────────────────────────────────────────────────
// CHARTS — SVG, no deps
// ─────────────────────────────────────────────────────────────────

function BarChart({ data, height = 280, currency = "USD Billion" }) {
  const max = Math.max(...data.map((d) => d.value)) * 1.18;
  const padL = 64, padR = 24, padT = 24, padB = 56;
  const width = 560;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const step = innerW / data.length;
  const barW = Math.min(step * 0.5, 88);

  const ticks = 5;
  const tickStep = max / ticks;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Market size bar chart" style={{ width: "100%", height: "auto" }}>
      {/* gridlines */}
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const y = padT + innerH - (i * innerH) / ticks;
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={width - padR} y2={y} stroke={C.surfaceSub} strokeWidth="1" />
            <text x={padL - 10} y={y + 4} textAnchor="end" fontSize="10.5" fill={C.textMuted} fontFamily="'JetBrains Mono', monospace">
              {(i * tickStep).toFixed(0)}
            </text>
          </g>
        );
      })}
      {/* bars */}
      {data.map((d, i) => {
        const x = padL + step * i + (step - barW) / 2;
        const h = (d.value / max) * innerH;
        const y = padT + innerH - h;
        const isForecast = d.label.toLowerCase().includes("forecast") || i === data.length - 1;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barW} height={h} rx="3" fill={isForecast ? C.accent : C.primary} />
            <text x={x + barW / 2} y={y - 8} textAnchor="middle" fontSize="11.5" fontWeight="700" fill={C.primary} fontFamily="'JetBrains Mono', monospace">
              {d.value.toFixed(1)}
            </text>
            <text x={x + barW / 2} y={height - padB + 18} textAnchor="middle" fontSize="11" fill={C.textMuted} fontFamily="'DM Sans', sans-serif">
              {d.label}
            </text>
            <text x={x + barW / 2} y={height - padB + 34} textAnchor="middle" fontSize="10" fill={C.textFaint} fontFamily="'JetBrains Mono', monospace">
              {d.year}
            </text>
          </g>
        );
      })}
      {/* y-axis label */}
      <text x={16} y={padT + innerH / 2} textAnchor="middle" fontSize="10" fill={C.textMuted}
            fontFamily="'JetBrains Mono', monospace" transform={`rotate(-90 16 ${padT + innerH / 2})`}>
        {currency}
      </text>
    </svg>
  );
}

function DonutChart({ leader, leaderShare, palette = DONUT_PALETTE }) {
  const size = 220;
  const r = 80;
  const stroke = 36;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const leaderLen = (leaderShare / 100) * circumference;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${leader} share`} style={{ width: "100%", maxWidth: 240, height: "auto" }}>
      <circle cx={cx} cy={cy} r={r} stroke={palette[5]} strokeWidth={stroke} fill="none" />
      <circle
        cx={cx} cy={cy} r={r}
        stroke={palette[0]} strokeWidth={stroke} fill="none"
        strokeDasharray={`${leaderLen} ${circumference - leaderLen}`}
        strokeDashoffset={circumference / 4}
        transform={`rotate(-90 ${cx} ${cy})`}
        strokeLinecap="butt"
      />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="28" fontWeight="700" fill={C.primary} fontFamily="'JetBrains Mono', monospace">
        {leaderShare.toFixed(1)}%
      </text>
      <text x={cx} y={cy + 18} textAnchor="middle" fontSize="10.5" fill={C.textMuted} fontFamily="'DM Sans', sans-serif">
        leading share
      </text>
    </svg>
  );
}

function ConcentrationGauge({ value }) {
  // value: 0 = fragmented, 1 = consolidated
  const v = Math.min(Math.max(value, 0), 1);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: C.textMuted, letterSpacing: "0.14em", textTransform: "uppercase" }}>Fragmented</span>
      <div style={{ position: "relative", flex: 1, minWidth: 220, height: 8, borderRadius: 4, background: `linear-gradient(to right, ${C.accent}, ${C.primary})` }}>
        <div
          style={{
            position: "absolute",
            left: `${v * 100}%`,
            top: -8,
            transform: "translateX(-50%)",
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "#fff",
            border: `3px solid ${C.alert}`,
            boxShadow: "0 4px 10px rgba(11,61,92,0.18)",
          }}
        />
        <div style={{
          position: "absolute",
          left: `${v * 100}%`,
          top: 22,
          transform: "translateX(-50%)",
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          color: C.primary,
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}>
          {v < 0.33 ? "Highly fragmented" : v < 0.66 ? "Moderately concentrated" : "Highly consolidated"}
        </div>
      </div>
      <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: C.textMuted, letterSpacing: "0.14em", textTransform: "uppercase" }}>Consolidated</span>
    </div>
  );
}

function HeatmapWorld({ regions, dominantName }) {
  const colorFor = (intensity) => intensity === "High" ? C.primary : intensity === "Medium" ? C.accent : C.accentLight;
  const dominant = dominantName
    || (regions.slice().sort((a, b) => (b.share || 0) - (a.share || 0))[0]?.name);
  // Stylized world strip — 5 abstract region blocks, not a literal map.
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 16 }}>
        {regions.map((r) => {
          const isDominant = r.name === dominant;
          return (
            <div
              key={r.name}
              style={{
                background: "#fff",
                border: `1px solid ${isDominant ? C.accent : C.border}`,
                borderRadius: 10,
                overflow: "hidden",
                boxShadow: isDominant ? "0 6px 16px rgba(26,111,232,0.12)" : "none",
                position: "relative",
              }}
            >
              <div style={{ height: 8, background: colorFor(r.intensity) }} />
              <div style={{ padding: "14px 14px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.primary }}>{r.name}</div>
                  {isDominant && (
                    <span style={{
                      fontSize: 8.5,
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: C.accent,
                      background: `${C.accent}15`,
                      border: `1px solid ${C.accent}40`,
                      borderRadius: 999,
                      padding: "2px 6px",
                      fontWeight: 600,
                    }}>Dominant</span>
                  )}
                </div>
                {isDominant ? (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                    <span style={{ fontSize: 18, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: C.text }}>{r.share}%</span>
                    <span style={{ fontSize: 11, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>{r.cagr}% CAGR</span>
                  </div>
                ) : (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 32,
                    marginBottom: 8,
                    borderRadius: 6,
                    background: `repeating-linear-gradient(135deg, ${C.surfaceAlt} 0 6px, ${C.surfaceSub} 6px 12px)`,
                    border: `1px dashed ${C.borderStrong}`,
                    color: C.textFaint,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                  }}>
                    Locked
                  </div>
                )}
                <span style={{
                  display: "inline-block",
                  fontSize: 9.5,
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: colorFor(r.intensity),
                  background: `${colorFor(r.intensity)}15`,
                  borderRadius: 999,
                  padding: "3px 8px",
                  border: `1px solid ${colorFor(r.intensity)}40`,
                }}>{r.intensity}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 18, alignItems: "center", fontSize: 11, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", flexWrap: "wrap" }}>
        <span>Intensity</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: C.primary }} /> High</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: C.accent }} /> Medium</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: C.accentLight }} /> Low</span>
        <span style={{ marginLeft: "auto", color: C.textFaint, textTransform: "none", letterSpacing: "0.04em", fontStyle: "italic" }}>
          Region-level share &amp; CAGR available in full report
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// REUSABLE PIECES
// ─────────────────────────────────────────────────────────────────

const SectionHeader = ({ id, eyebrow, title }) => (
  <div id={id} style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 14, marginBottom: 26 }}>
    {eyebrow && (
      <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: C.accent, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8 }}>{eyebrow}</div>
    )}
    <h2 style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 26, fontWeight: 700, color: C.primary, letterSpacing: "-0.01em" }}>{title}</h2>
  </div>
);

const CtaBox = ({ label, body, button }) => (
  <div style={{ background: C.alertSoft, border: `1.5px solid ${C.alert}40`, borderRadius: 10, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", justifyContent: "space-between", marginTop: 18 }}>
    <div style={{ flex: 1, minWidth: 220 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.alert, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.6 }}>{body}</div>
    </div>
    <button style={{ background: C.alert, color: "#fff", border: "none", borderRadius: 6, padding: "10px 18px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
      {button} →
    </button>
  </div>
);

const ChartCaption = ({ children }) => (
  <div style={{ fontSize: 10.5, color: C.textFaint, marginTop: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em", textAlign: "right" }}>
    Source: {BRAND} · {children}
  </div>
);

// ─────────────────────────────────────────────────────────────────
// SNAPSHOT DASHBOARD — compact KPI tiles shown near top of report
// ─────────────────────────────────────────────────────────────────

function SnapshotDashboard({ marketSize, regions = [], playersCount = 0 }) {
  const dominant = regions.slice().sort((a, b) => (b.share || 0) - (a.share || 0))[0];
  const fastest = regions.slice().sort((a, b) => (b.cagr || 0) - (a.cagr || 0))[0];
  const tiles = [
    {
      label: `Forecast Size · ${marketSize.forecastYear}`,
      value: `$${marketSize.forecastValue}`,
      suffix: "B",
      accent: C.primary,
      hint: `from $${marketSize.baseValue}B in ${marketSize.baseYear}`,
    },
    {
      label: "Projected CAGR",
      value: `${marketSize.cagr}`,
      suffix: "%",
      accent: C.accent,
      hint: `${marketSize.studyPeriod} study period`,
    },
    {
      label: "Largest Market",
      value: marketSize.largestMarket || dominant?.name || "—",
      suffix: dominant ? ` · ${dominant.share}%` : "",
      accent: C.green,
      hint: "Dominant share of global revenue",
      compact: true,
    },
    {
      label: "Fastest Growing",
      value: marketSize.fastestGrowingMarket || fastest?.name || "—",
      suffix: fastest ? ` · ${fastest.cagr}%` : "",
      accent: C.alert,
      hint: "Highest forecast CAGR region",
      compact: true,
    },
    {
      label: "Concentration",
      value: marketSize.marketConcentration || "Medium",
      suffix: "",
      accent: C.primaryLight,
      hint: "Top 5 players · combined share",
      compact: true,
    },
    {
      label: "Profiled Players",
      value: `${playersCount}`,
      suffix: "+",
      accent: C.text,
      hint: "Industry leaders + extended profiles",
    },
  ];

  return (
    <section
      aria-label="Market snapshot dashboard"
      style={{
        background: `linear-gradient(180deg, ${C.surfaceAlt}, #fff)`,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: "22px 24px 24px",
        marginBottom: 36,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: C.accent, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 4 }}>
            At a glance
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.primary, letterSpacing: "-0.005em" }}>
            Market snapshot dashboard
          </div>
        </div>
        <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: C.textFaint, letterSpacing: "0.08em" }}>
          Updated · {new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" })}
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 12,
        }}
      >
        {tiles.map((t) => (
          <div
            key={t.label}
            style={{
              background: "#fff",
              border: `1px solid ${C.border}`,
              borderLeft: `3px solid ${t.accent}`,
              borderRadius: 10,
              padding: "12px 14px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
              minHeight: 92,
            }}
          >
            <div style={{
              fontSize: 10.5,
              fontFamily: "'JetBrains Mono', monospace",
              color: C.textMuted,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}>
              {t.label}
            </div>
            <div style={{
              display: "flex",
              alignItems: "baseline",
              gap: 4,
              fontFamily: "'DM Sans', sans-serif",
              color: t.accent,
              fontWeight: 700,
              lineHeight: 1.1,
              fontSize: t.compact ? 16 : 22,
              wordBreak: "break-word",
            }}>
              <span>{t.value}</span>
              {t.suffix && (
                <span style={{ fontSize: t.compact ? 13 : 14, color: C.textMuted, fontWeight: 600 }}>
                  {t.suffix}
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: C.textFaint, lineHeight: 1.45 }}>
              {t.hint}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN REPORT
// ─────────────────────────────────────────────────────────────────

export default function MordorReport({ data, onClose, mode = "modal", backTo }) {
  const reportRef = useRef(null);
  const [openFaq, setOpenFaq] = useState(null);
  const isPageMode = mode === "page";

  useEffect(() => {
    if (isPageMode) return undefined;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isPageMode]);

  // ── SEO: per-report metadata + Report/FAQPage/BreadcrumbList JSON-LD ───
  const marketName = (data.industry || data.title || "Market").replace(/\s*market\s*$/i, "");
  const slug = slugify(marketName) || "report";
  const baseYear = data?.marketSize?.baseYear || new Date().getFullYear();
  const forecastYear = data?.marketSize?.forecastYear || baseYear + 6;
  const forecastValue = data?.marketSize?.forecastValue;
  const forecastValueText = typeof forecastValue === "number"
    ? `${forecastValue.toFixed(1)} billion`
    : "the projected value";
  const cagr = data?.marketSize?.cagr;
  const seoTitle = `${marketName} Market Size, Share & Forecast ${baseYear}-${forecastYear} | InsightAxis`;
  const seoDescription = `${marketName} market analysis: size, growth rate${
    cagr ? ` (${cagr.toFixed?.(1) || cagr}% CAGR)` : ""
  }, key players, regional breakdown, and forecast through ${forecastYear}. Projected to reach approximately USD ${forecastValueText} by ${forecastYear}.`;

  useSEO({
    title: seoTitle,
    description: seoDescription,
    path: `/markets/${slug}`,
    jsonLd: [
      buildReportSchema({
        name: `${marketName} Market Size & Share Report ${baseYear}-${forecastYear}`,
        description: seoDescription,
        marketName,
      }),
      buildFaqSchema(data.faqs),
      buildBreadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Markets", url: "/domains" },
        { name: `${marketName} Report`, url: `/markets/${slug}` },
      ]),
    ].filter(Boolean),
  });

  const sections = [
    { id: "executive-summary", label: "Executive Summary" },
    { id: "market-size", label: "Market Size & Share" },
    { id: "key-takeaways", label: "Key Takeaways" },
    { id: "drivers", label: "Drivers" },
    { id: "restraints", label: "Restraints" },
    { id: "segment-analysis", label: "Segment Analysis" },
    { id: "geography", label: "Geography Analysis" },
    { id: "competitive", label: "Competitive Landscape" },
    { id: "developments", label: "Recent Developments" },
    { id: "toc", label: "Table of Contents" },
    { id: "scope", label: "Report Scope" },
    { id: "faqs", label: "Key Questions Answered" },
  ];

  const ms = data.marketSize;
  const barData = [
    { label: "Base", year: ms.baseYear, value: ms.baseValue },
    { label: "Forecast", year: ms.forecastYear, value: ms.forecastValue },
  ];

  const handlePrint = () => {
    const printContent = reportRef.current?.innerHTML;
    if (!printContent) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>${data.title}</title>
      <style>
        body { font-family: 'DM Sans', Georgia, serif; color: #1A2333; padding: 32px; max-width: 920px; margin: 0 auto; line-height: 1.65; }
        h1, h2, h3 { color: ${C.primary}; }
        h2 { border-bottom: 2px solid ${C.primary}; padding-bottom: 8px; margin-top: 32px; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12.5px; }
        th { background: ${C.primary}; color: #fff; padding: 8px; text-align: left; }
        td { padding: 8px; border-bottom: 1px solid ${C.border}; vertical-align: top; }
        tr:nth-child(even) td { background: ${C.surfaceAlt}; }
        .cta-box { display: none; }
        button { display: none; }
        details { margin: 6px 0; }
        summary { font-weight: 600; cursor: pointer; padding: 8px 0; }
        @media print { @page { margin: 18mm; } }
      </style>
    </head><body>${printContent}
      <p style="margin-top: 30px; color:#888; font-size: 11px; border-top: 1px solid #ddd; padding-top: 8px;">
        © ${new Date().getFullYear()} ${BRAND} — Sample Report — All Rights Reserved
      </p>
      <script>window.onload = () => { window.print(); };</script>
    </body></html>`);
    w.document.close();
  };

  const reportInner = (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        maxWidth: 1100,
        margin: isPageMode ? "0 auto" : "30px auto",
        background: C.surface,
        color: C.text,
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: isPageMode ? "0 12px 40px rgba(0,0,0,0.3)" : "0 40px 100px rgba(0,0,0,0.5)",
      }}
    >
      {/* TOP CONTROL BAR */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: C.primary, color: "#fff", padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", minWidth: 0 }}>
          <span style={{ fontSize: 10.5, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.22em", textTransform: "uppercase", opacity: 0.7 }}>
            {BRAND} · Sample Report
          </span>
          <span style={{ width: 1, height: 16, background: "rgba(255,255,255,0.2)" }} />
          <span style={{ fontSize: 12, opacity: 0.85 }}>Last updated: {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handlePrint} style={{ background: C.alert, color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
            Export PDF
          </button>
          {isPageMode && backTo ? (
            <a
              href={backTo}
              style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 6, padding: "8px 14px", fontSize: 12.5, cursor: "pointer", textDecoration: "none", fontWeight: 500 }}
            >
              ← Back
            </a>
          ) : (
            <button onClick={onClose} aria-label="Close report" style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 6, padding: "8px 14px", fontSize: 14, cursor: "pointer" }}>
              ✕
            </button>
          )}
        </div>
      </div>

        {/* PRINTED REPORT BODY */}
        <div ref={reportRef} style={{ padding: "48px 56px 64px" }}>
          {/* HERO */}
          <header id="executive-summary" style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: C.accent, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 14 }}>
              Industry research report
            </div>
            <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(1.8rem, 3.4vw, 2.6rem)", fontWeight: 700, color: C.primary, margin: "0 0 18px", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
              {data.title}
            </h1>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: C.textMuted, margin: "0 0 24px", maxWidth: 820 }}>
              {data.executive}
            </p>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <button style={{ background: C.alert, color: "#fff", border: "none", borderRadius: 6, padding: "13px 26px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", letterSpacing: "0.02em" }}>
                Buy Now →
              </button>
              <button style={{ background: "transparent", color: C.primary, border: `1.5px solid ${C.primary}`, borderRadius: 6, padding: "13px 22px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
                Download sample
              </button>
              <span style={{ fontSize: 11.5, fontFamily: "'JetBrains Mono', monospace", color: C.textFaint, marginLeft: 4 }}>
                Study period · {ms.studyPeriod}
              </span>
            </div>
          </header>

          {/* SNAPSHOT DASHBOARD */}
          <SnapshotDashboard
            marketSize={ms}
            regions={data.geography?.regions || []}
            playersCount={(ms.majorPlayers?.length || 0) + (data.competitive?.extendedProfiles?.length || 0)}
          />

          {/* MARKET SIZE & SHARE */}
          <section style={{ marginBottom: 44 }}>
            <SectionHeader id="market-size" eyebrow="01" title="Market Size & Share" />
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)", gap: 28, alignItems: "stretch" }}>
              <div style={{ background: C.surfaceAlt, borderRadius: 12, padding: "20px 22px", border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 12, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
                  Market size (USD Billion)
                </div>
                <div style={{ position: "relative" }}>
                  <BarChart data={barData} />
                  <div style={{
                    position: "absolute", top: 18, right: 18,
                    background: C.primary, color: "#fff", padding: "6px 12px", borderRadius: 6,
                    fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 6, boxShadow: "0 6px 16px rgba(11,61,92,0.3)",
                  }}>
                    ↗ CAGR {ms.cagr}%
                  </div>
                </div>
                <ChartCaption>{ms.studyPeriod}</ChartCaption>
              </div>

              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.primary, marginBottom: 10 }}>Market overview</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                  <tbody>
                    {[
                      ["Study period", ms.studyPeriod],
                      [`Market size (${ms.baseYear})`, `USD ${ms.baseValue} Billion`],
                      [`Market size (${ms.forecastYear})`, `USD ${ms.forecastValue} Billion`],
                      ["CAGR", `${ms.cagr}%`],
                      ["Fastest growing market", ms.fastestGrowingMarket],
                      ["Largest market", ms.largestMarket],
                      ["Market concentration", ms.marketConcentration],
                    ].map((row, i) => (
                      <tr key={row[0]} style={{ background: i % 2 ? C.surfaceAlt : "#fff" }}>
                        <td style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}`, color: C.textMuted, fontSize: 11.5, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", width: "55%" }}>{row[0]}</td>
                        <td style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}`, color: C.text, fontWeight: 600 }}>{row[1]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: 14, fontSize: 12, color: C.textMuted, fontWeight: 600 }}>Major Players</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {ms.majorPlayers.slice(0, 8).map((p) => (
                    <span key={p} style={{ fontSize: 11.5, padding: "5px 10px", background: C.surfaceSub, color: C.primary, borderRadius: 999, fontWeight: 500 }}>{p}</span>
                  ))}
                </div>
                <div style={{ fontSize: 10.5, color: C.textFaint, fontStyle: "italic", marginTop: 8 }}>*Sorted in no particular order</div>
              </div>
            </div>
            <CtaBox label="Get detailed forecasts" body="Access full year-by-year projections, scenario analysis, and regional drill-downs." button="Request access" />
          </section>

          {/* TAKEAWAYS */}
          <section style={{ marginBottom: 44 }}>
            <SectionHeader id="key-takeaways" eyebrow="02" title="Key Report Takeaways" />
            <div style={{ display: "grid", gap: 10 }}>
              {data.takeaways.map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 14, padding: "14px 16px", background: C.surfaceAlt, borderLeft: `3px solid ${C.accent}`, borderRadius: 6 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.accent, fontWeight: 600, paddingTop: 1 }}>0{i + 1}</span>
                  <span style={{ fontSize: 13.5, color: C.text, lineHeight: 1.7 }}>{t}</span>
                </div>
              ))}
            </div>
          </section>

          {/* DRIVERS */}
          <section style={{ marginBottom: 44 }}>
            <SectionHeader id="drivers" eyebrow="03" title="Market Trends & Insights — Drivers" />
            <div style={{ overflowX: "auto", marginBottom: 24, borderRadius: 8, border: `1px solid ${C.border}` }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: C.primary, color: "#fff" }}>
                    {["Driver", "Impact", "Region", "Timeline"].map((h) => (
                      <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontWeight: 600, fontSize: 11.5, letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.drivers.map((d, i) => (
                    <tr key={d.name} style={{ background: i % 2 ? C.surfaceAlt : "#fff" }}>
                      <td style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, fontWeight: 600, color: C.text }}>{d.name}</td>
                      <td style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, color: C.green, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{d.impact}</td>
                      <td style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, color: C.textMuted }}>{d.region}</td>
                      <td style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, color: C.textMuted }}>{d.timeline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: "grid", gap: 22 }}>
              {data.drivers.map((d, i) => (
                <div key={d.name}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: C.primary, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.accent }}>0{i + 1}</span>
                    {d.name}
                  </h3>
                  <p style={{ fontSize: 14, lineHeight: 1.8, color: C.textMuted, margin: 0 }}>{d.paragraph}</p>
                </div>
              ))}
            </div>
          </section>

          {/* RESTRAINTS */}
          <section style={{ marginBottom: 44 }}>
            <SectionHeader id="restraints" eyebrow="04" title="Market Trends & Insights — Restraints" />
            <div style={{ overflowX: "auto", marginBottom: 24, borderRadius: 8, border: `1px solid ${C.border}` }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: C.primary, color: "#fff" }}>
                    {["Restraint", "Impact", "Region", "Timeline"].map((h) => (
                      <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontWeight: 600, fontSize: 11.5, letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.restraints.map((d, i) => (
                    <tr key={d.name} style={{ background: i % 2 ? C.surfaceAlt : "#fff" }}>
                      <td style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, fontWeight: 600, color: C.text }}>{d.name}</td>
                      <td style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, color: C.red, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{d.impact}</td>
                      <td style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, color: C.textMuted }}>{d.region}</td>
                      <td style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, color: C.textMuted }}>{d.timeline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: "grid", gap: 22 }}>
              {data.restraints.map((d, i) => (
                <div key={d.name}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: C.primary, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.red }}>0{i + 1}</span>
                    {d.name}
                  </h3>
                  <p style={{ fontSize: 14, lineHeight: 1.8, color: C.textMuted, margin: 0 }}>{d.paragraph}</p>
                </div>
              ))}
            </div>
          </section>

          {/* SEGMENT ANALYSIS */}
          <section style={{ marginBottom: 44 }}>
            <SectionHeader id="segment-analysis" eyebrow="05" title="Segment Analysis" />
            <div style={{ display: "grid", gap: 32 }}>
              {data.segments.map((seg, i) => (
                <div key={seg.dimension} style={{ borderTop: i > 0 ? `1px solid ${C.border}` : "none", paddingTop: i > 0 ? 28 : 0 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: C.primary, margin: "0 0 18px" }}>{seg.headline}</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "minmax(0,0.7fr) minmax(0,1.6fr)", gap: 28, alignItems: "center" }}>
                    <div style={{ background: C.surfaceAlt, borderRadius: 12, padding: 20, border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <DonutChart leader={seg.leader.name} leaderShare={seg.leader.share} />
                      <div style={{ marginTop: 12, fontSize: 12, color: C.primary, textAlign: "center", fontWeight: 600 }}>{seg.leader.name}</div>
                      <div style={{ fontSize: 10.5, color: C.textFaint, marginTop: 2, fontStyle: "italic", textAlign: "center" }}>Segment shares of all individual segments available upon report purchase</div>
                    </div>
                    <div style={{ display: "grid", gap: 18 }}>
                      <div>
                        <div style={{ display: "inline-block", fontSize: 10.5, color: C.primary, background: C.surfaceSub, padding: "3px 10px", borderRadius: 999, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
                          Leader · {seg.leader.share}% share
                        </div>
                        <p style={{ fontSize: 13.5, lineHeight: 1.75, color: C.text, margin: 0 }}>{seg.leader.paragraph}</p>
                      </div>
                      <div>
                        <div style={{ display: "inline-block", fontSize: 10.5, color: C.alert, background: C.alertSoft, padding: "3px 10px", borderRadius: 999, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
                          Fastest · {seg.fastest.cagr}% CAGR
                        </div>
                        <p style={{ fontSize: 13.5, lineHeight: 1.75, color: C.text, margin: 0 }}>{seg.fastest.paragraph}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* GEOGRAPHY */}
          <section style={{ marginBottom: 44 }}>
            <SectionHeader id="geography" eyebrow="06" title="Geography Analysis" />
            <HeatmapWorld regions={data.geography.regions} dominantName={ms.largestMarket} />
            <div style={{ display: "grid", gap: 22, marginTop: 28 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.primary, margin: "0 0 8px" }}>Largest region</h3>
                <p style={{ fontSize: 14, lineHeight: 1.8, color: C.textMuted, margin: 0 }}>{data.geography.largestParagraph}</p>
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.primary, margin: "0 0 8px" }}>Fastest growing region</h3>
                <p style={{ fontSize: 14, lineHeight: 1.8, color: C.textMuted, margin: 0 }}>{data.geography.fastestParagraph}</p>
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.primary, margin: "0 0 8px" }}>Mature markets</h3>
                <p style={{ fontSize: 14, lineHeight: 1.8, color: C.textMuted, margin: 0 }}>{data.geography.matureParagraph}</p>
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.primary, margin: "0 0 8px" }}>Emerging markets</h3>
                <p style={{ fontSize: 14, lineHeight: 1.8, color: C.textMuted, margin: 0 }}>{data.geography.emergingParagraph}</p>
              </div>
            </div>
            <CtaBox label="Get analysis on geographic markets" body="Country-level breakdowns, currency normalization, and regulatory landscape included in full report." button="Request country data" />
          </section>

          {/* COMPETITIVE */}
          <section style={{ marginBottom: 44 }}>
            <SectionHeader id="competitive" eyebrow="07" title="Competitive Landscape" />
            <p style={{ fontSize: 14, lineHeight: 1.8, color: C.textMuted, margin: "0 0 18px" }}>{data.competitive.fragmentationParagraph}</p>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: C.textMuted, margin: "0 0 28px" }}>{data.competitive.strategiesParagraph}</p>

            <div style={{ background: C.surfaceAlt, borderRadius: 12, padding: 22, border: `1px solid ${C.border}`, marginBottom: 28 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.primary, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14, fontFamily: "'JetBrains Mono', monospace" }}>Industry Leaders</div>
              <ol style={{ margin: 0, paddingLeft: 22, fontSize: 14, color: C.text, lineHeight: 1.9 }}>
                {data.competitive.industryLeaders.map((name) => (
                  <li key={name} style={{ fontWeight: 600 }}>{name}</li>
                ))}
              </ol>
              <div style={{ marginTop: 10, fontSize: 11, color: C.textFaint, fontStyle: "italic" }}>*Sorted in no particular order</div>
            </div>

            <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: "22px 24px 32px", marginBottom: 28 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.primary, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 18, fontFamily: "'JetBrains Mono', monospace" }}>Market Concentration</div>
              <ConcentrationGauge value={data.competitive.concentration} />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.primary, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }}>Extended Company Profiles</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 6 }}>
                {data.competitive.extendedProfiles.map((p) => (
                  <div key={p} style={{ background: C.surfaceAlt, padding: "9px 14px", fontSize: 12.5, color: C.text, borderRadius: 6, border: `1px solid ${C.border}` }}>{p}</div>
                ))}
              </div>
            </div>

            <CtaBox label="Need more details on market players?" body="Detailed profiles include strategy, product portfolio, recent moves, financials, and SWOT." button="View full profiles" />
          </section>

          {/* DEVELOPMENTS */}
          <section style={{ marginBottom: 44 }}>
            <SectionHeader id="developments" eyebrow="08" title="Recent Industry Developments" />
            <div style={{ display: "grid", gap: 14 }}>
              {data.developments.map((d, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 16, padding: "16px 18px", background: C.surfaceAlt, borderRadius: 8, border: `1px solid ${C.border}` }}>
                  <div>
                    <div style={{ fontSize: 11, color: C.accent, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>{d.date}</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: C.primary }}>{d.company}</div>
                  </div>
                  <div style={{ fontSize: 13.5, color: C.textMuted, lineHeight: 1.7 }}>{d.description}</div>
                </div>
              ))}
            </div>
          </section>

          {/* TOC */}
          <section style={{ marginBottom: 44 }}>
            <SectionHeader id="toc" eyebrow="09" title="Table of Contents" />
            <Toc data={data} sections={sections} />
          </section>

          {/* SCOPE */}
          <section style={{ marginBottom: 44 }}>
            <SectionHeader id="scope" eyebrow="10" title="Report Scope" />
            <div style={{ overflowX: "auto", border: `1px solid ${C.border}`, borderRadius: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: C.primary, color: "#fff" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, fontSize: 11.5, letterSpacing: "0.08em", textTransform: "uppercase", width: "30%" }}>Dimension</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, fontSize: 11.5, letterSpacing: "0.08em", textTransform: "uppercase" }}>Sub-segments</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.scope).map(([dim, items], i) => (
                    <tr key={dim} style={{ background: i % 2 ? C.surfaceAlt : "#fff" }}>
                      <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, fontWeight: 600, color: C.primary, verticalAlign: "top" }}>{dim}</td>
                      <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, color: C.text }}>
                        {(items || []).join(" · ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* FAQs */}
          <section style={{ marginBottom: 44 }}>
            <SectionHeader id="faqs" eyebrow="11" title="Key Questions Answered" />
            <div style={{ display: "grid", gap: 8 }}>
              {data.faqs.map((f, i) => {
                const open = openFaq === i;
                return (
                  <div key={i} style={{ background: "#fff", border: `1px solid ${open ? C.accent : C.border}`, borderRadius: 8, overflow: "hidden", transition: "border-color 180ms ease" }}>
                    <button
                      onClick={() => setOpenFaq(open ? null : i)}
                      style={{ width: "100%", textAlign: "left", padding: "14px 18px", background: open ? C.surfaceSub : "#fff", border: "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, cursor: "pointer" }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.primary }}>{f.q}</span>
                      <span style={{ fontSize: 22, color: C.accent, fontWeight: 300, flexShrink: 0, lineHeight: 1, transform: open ? "rotate(45deg)" : "none", transition: "transform 200ms ease" }}>+</span>
                    </button>
                    {open && (
                      <div style={{ padding: "14px 18px 18px", borderTop: `1px solid ${C.border}` }}>
                        <p style={{ margin: 0, fontSize: 13.5, color: C.textMuted, lineHeight: 1.75 }}>{f.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Footer */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 18, marginTop: 32, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ fontSize: 11, color: C.textFaint, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em" }}>
              © {new Date().getFullYear()} {BRAND} · Sample report · All charts: Source {BRAND}
            </div>
            <div style={{ fontSize: 11, color: C.textFaint, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em" }}>
              Page last updated on: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </div>
          </div>
        </div>
      </div>
  );

  if (isPageMode) {
    return reportInner;
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000, background: "rgba(5,14,26,0.85)",
        backdropFilter: "blur(12px)", overflowY: "auto",
      }}
      onClick={onClose}
    >
      {reportInner}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TOC — nested anchor list
// ─────────────────────────────────────────────────────────────────

function Toc({ data, sections }) {
  const dims = Object.keys(data.scope).filter((k) => k !== "Geography");
  const geos = data.scope.Geography || [];
  const competitors = (data.competitive?.topPlayers || []).map((p) => p.name).slice(0, 8);

  const tocTree = [
    {
      title: "1. Introduction",
      items: [
        "1.1 Study Assumptions",
        "1.2 Scope of the Study",
        "1.3 Market Definition",
        "1.4 Currency Considerations",
        "1.5 Stakeholders",
      ],
    },
    {
      title: "2. Research Methodology",
      items: [
        "2.1 Analysis Methodology",
        "2.2 Research Phases",
        "2.3 Primary Research",
        "2.4 Secondary Research",
        "2.5 Data Triangulation & Validation",
        "2.6 Forecast Modelling Approach",
        "2.7 Limitations & Assumptions",
      ],
    },
    {
      title: "3. Executive Summary",
      anchor: "executive-summary",
      items: [
        "3.1 Market Snapshot",
        "3.2 Key Findings",
        "3.3 Strategic Implications",
        "3.4 Analyst Perspective",
      ],
    },
    {
      title: "4. Market Insights",
      anchor: "drivers",
      items: [
        "4.1 Market Overview",
        "4.2 Market Drivers",
        "  4.2.1 Demand-Side Drivers",
        "  4.2.2 Supply-Side Drivers",
        "  4.2.3 Technology & Innovation Catalysts",
        "4.3 Market Restraints",
        "  4.3.1 Operational Restraints",
        "  4.3.2 Regulatory & Compliance Restraints",
        "4.4 Market Opportunities",
        "4.5 Value Chain / Supply Chain Analysis",
        "4.6 Industry Attractiveness — Porter's Five Forces",
        "  4.6.1 Threat of New Entrants",
        "  4.6.2 Bargaining Power of Buyers",
        "  4.6.3 Bargaining Power of Suppliers",
        "  4.6.4 Threat of Substitutes",
        "  4.6.5 Intensity of Competitive Rivalry",
        "4.7 PESTEL Analysis",
        "4.8 Macroeconomic Outlook & Impact",
        "4.9 Regulatory Landscape",
        "4.10 Technology Snapshot & Emerging Trends",
        "4.11 Pricing Analysis",
        "4.12 Consumer Behaviour & Buying Patterns",
        "4.13 Trade Analysis (Imports & Exports)",
      ],
    },
    {
      title: "5. Market Sizing & Forecasts",
      anchor: "market-size",
      items: [
        `5.1 Historical Market Size (${data.market?.baseYear - 3 || 2022}-${data.market?.baseYear || 2025})`,
        `5.2 Forecast Market Size (${data.market?.baseYear || 2025}-${data.market?.forecastEndYear || 2031})`,
        "5.3 Volume vs Value Forecasts",
        "5.4 Market Attractiveness Index",
      ],
    },
    {
      title: "6. Market Segmentation",
      anchor: "segment-analysis",
      items: [
        ...dims.flatMap((d, i) => [
          `6.${i + 1} By ${d}`,
          `  6.${i + 1}.1 Market Size & Forecast`,
          `  6.${i + 1}.2 Key Sub-Segments`,
          `  6.${i + 1}.3 Growth Outlook`,
        ]),
        `6.${dims.length + 1} By Geography`,
        ...geos.map((g, j) => `  6.${dims.length + 1}.${j + 1} ${g}`),
      ],
    },
    {
      title: "7. Competitive Landscape",
      anchor: "competitive",
      items: [
        "7.1 Market Concentration & Vendor Share Analysis",
        "7.2 Strategic Moves — M&A, Partnerships, Investments",
        "7.3 Market Share Analysis",
        "7.4 Competitive Benchmarking",
        "7.5 Company Profiles",
        ...competitors.map((name, k) => `  7.5.${k + 1} ${name}`),
        "7.6 List of Other Notable Companies",
      ],
    },
    {
      title: "8. Market Opportunities & Future Outlook",
      items: [
        "8.1 White-Space Opportunities",
        "8.2 Investment Outlook",
        "8.3 Strategic Recommendations",
        "8.4 Future Scenario Modelling (Base / Bull / Bear)",
      ],
    },
    {
      title: "9. Recent Industry Developments",
      anchor: "developments",
      items: [
        "9.1 Mergers & Acquisitions",
        "9.2 Product Launches & Innovations",
        "9.3 Strategic Partnerships",
        "9.4 Capacity Expansions",
        "9.5 Regulatory & Policy Updates",
      ],
    },
    {
      title: "10. Appendix",
      items: [
        "10.1 Macroeconomic Indicators",
        "10.2 Currency & Exchange Rates",
        "10.3 List of Abbreviations",
        "10.4 Glossary of Terms",
        "10.5 References & Data Sources",
        "10.6 About InsightAxis Intelligence",
      ],
    },
  ];

  const jumpTo = (id) => {
    if (!id) return;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 0" }}>
      {tocTree.map((node, i) => (
        <details key={node.title} open={i < 2} style={{ borderBottom: i < tocTree.length - 1 ? `1px solid ${C.border}` : "none" }}>
          <summary
            style={{ padding: "12px 20px", cursor: "pointer", fontSize: 13.5, fontWeight: 600, color: C.primary, display: "flex", alignItems: "center", justifyContent: "space-between", listStyle: "none" }}
            onClick={(e) => {
              if (node.anchor) {
                e.preventDefault();
                jumpTo(node.anchor);
              }
            }}
          >
            <span>{node.title}</span>
            <span style={{ fontSize: 10, color: C.textFaint, fontFamily: "'JetBrains Mono', monospace" }}>{node.items.length} items</span>
          </summary>
          <div style={{ padding: "0 20px 14px 36px" }}>
            {node.items.map((it) => {
              const indent = it.startsWith("  ") ? 18 : 0;
              const trimmed = it.replace(/^\s+/, "");
              const isSub = indent > 0;
              return (
                <div
                  key={it}
                  style={{
                    padding: "3px 0",
                    paddingLeft: indent,
                    fontSize: isSub ? 11.5 : 12.5,
                    color: isSub ? C.textFaint : C.textMuted,
                    fontFamily: isSub ? "'JetBrains Mono', monospace" : "inherit",
                  }}
                >
                  {isSub ? "› " : "· "}{trimmed}
                </div>
              );
            })}
          </div>
        </details>
      ))}
      <style>{`details > summary::-webkit-details-marker { display: none; }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// INPUT FORM (Generator)
// ─────────────────────────────────────────────────────────────────

export function MordorReportForm({ initialTopic = "", onGenerated }) {
  const [industry, setIndustry] = useState(initialTopic);
  const [baseYear, setBaseYear] = useState(2025);
  const [forecastEndYear, setForecastEndYear] = useState(2031);
  const [geographies, setGeographies] = useState(["North America", "Europe", "Asia-Pacific"]);
  const [dimCount, setDimCount] = useState(4);
  const [audience, setAudience] = useState("Enterprises");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { if (initialTopic) setIndustry(initialTopic); }, [initialTopic]);

  const dimensions = useMemo(() => DEFAULT_DIMENSIONS.slice(0, dimCount), [dimCount]);

  const toggleGeo = (g) => {
    setGeographies((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  };

  const handleGenerate = async () => {
    const topic = industry.trim();
    if (!topic) return;
    setLoading(true);
    setError(null);

    const input = {
      industry: topic,
      baseYear: Number(baseYear),
      forecastEndYear: Number(forecastEndYear),
      geographies,
      dimensions,
      audience,
    };

    const fallback = buildLocalMordorReport(input);
    let final = fallback;

    try {
      const text = await generateGeminiText(buildMordorPrompt(input), 6000);
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      final = normalizeReport(parsed, fallback);
    } catch {
      // silent fallback
    }

    setLoading(false);
    onGenerated(final);
  };

  const fieldLabel = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "var(--gold)",
    display: "block",
    marginBottom: 10,
  };

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "60px 0 80px" }}>
      <div className="reveal" style={{ textAlign: "center", marginBottom: 44 }}>
        <span className="section-label" style={{ justifyContent: "center", marginBottom: 18 }}>Report Builder</span>
        <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 600, margin: "0 0 14px", lineHeight: 1.15 }}>
          Build a <em style={{ color: "var(--gold)", fontStyle: "italic" }}>sample</em> research report
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-muted)", margin: "0 auto", maxWidth: 640, lineHeight: 1.75 }}>
          Configure the scope below — we'll generate market sizing, drivers, segment analysis, geography breakdown, competitive landscape, and a full TOC.
        </p>
      </div>

      <div className="reveal reveal-delay-1" style={{ background: "var(--card-bg)", borderRadius: 14, border: "1px solid var(--border)", padding: 32, display: "grid", gap: 28 }}>
        {/* Industry */}
        <div>
          <label style={fieldLabel}>Industry or market name</label>
          <input
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            placeholder="e.g. Functional Beverages, Smart Packaging, EV Battery Recycling…"
            className="field-input"
            autoFocus
          />
        </div>

        {/* Years */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div>
            <label style={fieldLabel}>Base year</label>
            <input
              type="number" min={2020} max={2030}
              value={baseYear}
              onChange={(e) => setBaseYear(e.target.value)}
              className="field-input"
            />
          </div>
          <div>
            <label style={fieldLabel}>Forecast end year</label>
            <input
              type="number" min={Number(baseYear) + 2} max={Number(baseYear) + 15}
              value={forecastEndYear}
              onChange={(e) => setForecastEndYear(e.target.value)}
              className="field-input"
            />
          </div>
        </div>

        {/* Geographies */}
        <div>
          <label style={fieldLabel}>Geographies (select all that apply)</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {REGION_OPTIONS.map((g) => {
              const active = geographies.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGeo(g)}
                  style={{
                    background: active ? "var(--gold)" : "transparent",
                    color: active ? "var(--navy)" : "var(--cream-dim)",
                    border: `1px solid ${active ? "var(--gold)" : "var(--border-strong)"}`,
                    borderRadius: 999,
                    padding: "7px 14px",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 180ms ease",
                  }}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dimensions */}
        <div>
          <label style={fieldLabel}>Number of segmentation dimensions ({dimensions.length})</label>
          <input
            type="range" min={2} max={4} step={1}
            value={dimCount}
            onChange={(e) => setDimCount(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--gold)" }}
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {dimensions.map((d) => (
              <span key={d} style={{
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                color: "var(--gold)",
                background: "rgba(200,147,58,0.08)",
                border: "1px solid var(--border-gold)",
                borderRadius: 999,
                padding: "4px 10px",
                letterSpacing: "0.08em",
              }}>{d}</span>
            ))}
          </div>
        </div>

        {/* Audience */}
        <div>
          <label style={fieldLabel}>Target audience</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {AUDIENCE_OPTIONS.map((a) => {
              const active = audience === a;
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAudience(a)}
                  style={{
                    background: active ? "var(--gold)" : "transparent",
                    color: active ? "var(--navy)" : "var(--cream-dim)",
                    border: `1px solid ${active ? "var(--gold)" : "var(--border-strong)"}`,
                    borderRadius: 999,
                    padding: "7px 14px",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 180ms ease",
                  }}
                >
                  {a}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", paddingTop: 4 }}>
          <button
            onClick={handleGenerate}
            disabled={loading || !industry.trim()}
            className="btn-gold"
            style={{ opacity: loading || !industry.trim() ? 0.55 : 1, cursor: loading || !industry.trim() ? "not-allowed" : "pointer" }}
          >
            {loading ? "Generating report…" : "Generate report →"}
          </button>
          {loading && (
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em" }}>
              ⌛ Analyzing market signals · synthesizing 11 sections
            </span>
          )}
          {error && <span style={{ fontSize: 12, color: "var(--gold-light)" }}>{error}</span>}
        </div>
      </div>

      {/* Examples */}
      <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {["Functional Beverages Market", "Lithium-Ion Battery Recycling", "Smart Packaging Solutions"].map((ex, i) => (
          <button
            key={ex}
            onClick={() => setIndustry(ex)}
            className="reveal"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "14px 16px",
              cursor: "pointer",
              fontSize: 13,
              color: "var(--cream-dim)",
              textAlign: "left",
              transition: "all 180ms ease",
              transitionDelay: `${0.05 + i * 0.08}s`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-gold)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
          >
            <div className="mono" style={{ fontSize: 10, color: "var(--text-faint)", marginBottom: 4, letterSpacing: "0.18em", textTransform: "uppercase" }}>Try example</div>
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SIMPLE WRAPPER: build a Mordor report for a pre-existing market click
// ─────────────────────────────────────────────────────────────────

export function buildReportForMarket(market) {
  const input = {
    industry: market.name?.replace(/\s+Market$/i, "") || "Industry",
    baseYear: market.year || 2025,
    forecastEndYear: (market.year || 2025) + 6,
    geographies: ["North America", "Europe", "Asia-Pacific", "Latin America", "Middle East & Africa"],
    dimensions: DEFAULT_DIMENSIONS,
    audience: "Enterprises",
  };
  return buildLocalMordorReport(input);
}
