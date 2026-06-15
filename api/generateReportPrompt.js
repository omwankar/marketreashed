/**
 * AI prompt for /generate sample reports — accuracy-first, real companies, current context.
 */

const DEFAULT_DIMENSIONS = ["Product Type", "Ingredient / Component", "Form", "Distribution Channel"];

export function buildGenerateReportPrompt(input) {
  const {
    industry,
    baseYear,
    forecastEndYear,
    geographies,
    dimensions = DEFAULT_DIMENSIONS,
    audience,
  } = input;

  const currentYear = baseYear + 1;
  const today = new Date().toISOString().slice(0, 10);
  const forecastYears = Math.max(1, forecastEndYear - baseYear);

  return `You are a senior market research analyst. Today is ${today}. Produce a sample market research report for: "${industry}".

ACCURACY RULES (mandatory):
1. Use ONLY real, verifiable companies that actually operate in "${industry}". Never invent names like "Apex Holdings" or "Nexora Corp".
2. Market sizes (USD billions) must be realistic order-of-magnitude estimates based on your latest training knowledge. If uncertain, use conservative mid-range estimates — never absurd figures.
3. CAGR and forecast math MUST be consistent: forecastValue ≈ baseValue × (1 + cagr/100)^${forecastYears} (within 5%).
4. Recent developments: only include real announcements you are confident occurred (2023–${currentYear}). If unsure, omit rather than fabricate.
5. Regional shares must sum to ~100%. Segment shares within each dimension must be plausible.
6. Do not cite specific fake report IDs or fabricated statistics. Prefer well-known industry facts.

Audience: ${audience}.
Base year: ${baseYear}. Current year: ${currentYear}. Forecast: ${currentYear}–${forecastEndYear}.
Geographies: ${geographies.join(", ")}.
Segmentation dimensions (${dimensions.length}): ${dimensions.join(", ")}.

Respond ONLY with valid JSON matching this shape (numeric fields as numbers, not strings):

{
  "title": "${industry} Market Size & Share Analysis - Growth Trends and Forecast (${currentYear} - ${forecastEndYear})",
  "executive": "150-200 word executive summary",
  "marketSize": {
    "baseYear": ${baseYear},
    "currentYear": ${currentYear},
    "forecastYear": ${forecastEndYear},
    "baseValue": number,
    "currentValue": number,
    "forecastValue": number,
    "cagr": number,
    "studyPeriod": "${baseYear}-${forecastEndYear}",
    "fastestGrowingMarket": "region name",
    "largestMarket": "region name",
    "marketConcentration": "Low" | "Medium" | "High",
    "majorPlayers": ["6-8 real company names"]
  },
  "takeaways": ["5 concise bullet strings with real segment/region names and numeric shares/CAGRs"],
  "drivers": [{"name":"short name","impact":"+X.X%","region":"Global or region","timeline":"Short-term|Medium-term|Long-term","paragraph":"120-160 words"}],
  "restraints": [{"name":"short name","impact":"-X.X%","region":"Global or region","timeline":"Short-term|Medium-term|Long-term","paragraph":"120-160 words"}],
  "segments": [
    ${dimensions
      .map(
        (d) => `{"dimension":"${d}","headline":"By ${d}: [Real Leader] Holds the Largest Share","leader":{"name":"real segment label","share":number,"paragraph":"120-160 words"},"fastest":{"name":"real segment label","cagr":number,"paragraph":"120-160 words"},"subSegments":["5-7 real sub-segment names"]}`,
      )
      .join(",\n    ")}
  ],
  "geography": {
    "regions": [
      {"name":"North America","share":number,"intensity":"High|Medium|Low","cagr":number},
      {"name":"Europe","share":number,"intensity":"High|Medium|Low","cagr":number},
      {"name":"Asia-Pacific","share":number,"intensity":"High|Medium|Low","cagr":number},
      {"name":"Latin America","share":number,"intensity":"High|Medium|Low","cagr":number},
      {"name":"Middle East & Africa","share":number,"intensity":"High|Medium|Low","cagr":number}
    ],
    "largestParagraph": "150-180 words",
    "fastestParagraph": "150-180 words",
    "matureParagraph": "120-150 words",
    "emergingParagraph": "120-150 words"
  },
  "competitive": {
    "fragmentationParagraph": "150-180 words on real competitive structure",
    "strategiesParagraph": "150-180 words on strategies of named leaders",
    "industryLeaders": ["5 real top companies"],
    "concentration": number between 0 and 1,
    "extendedProfiles": ["12-15 additional real companies in the space"]
  },
  "developments": [
    {"date":"Month YYYY","company":"real company","description":"40-60 words — only if confident this happened"}
  ],
  "scope": {
    ${dimensions.map((d) => `"${d}": ["5-7 sub-segment strings"]`).join(",\n    ")},
    "Geography": ${JSON.stringify(geographies)}
  },
  "faqs": [
    {"q":"projected value by ${forecastEndYear}","a":"70-100 words with numbers"},
    {"q":"largest region share","a":"70-100 words"},
    {"q":"fastest growing segment","a":"70-100 words"},
    {"q":"fastest growing region CAGR","a":"70-100 words"},
    {"q":"competitive dynamic","a":"70-100 words"}
  ],
  "dataAsOf": "${today}",
  "methodologyNote": "Sample generated from AI using publicly known industry structure; validate with analysts before investment decisions."
}`;
}
