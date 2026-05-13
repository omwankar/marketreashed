export const GEO_REGIONS = ["North America", "Europe", "Asia Pacific", "LATAM", "MEA"];

export const GEO_COUNTRIES = [
  "United States",
  "China",
  "India",
  "Germany",
  "United Kingdom",
  "Japan",
  "Brazil",
  "France",
  "Canada",
  "Australia",
  "South Korea",
  "Mexico",
  "Indonesia",
  "Saudi Arabia",
  "Italy",
];

function hashCode(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function parseMarketValue(value) {
  const normalized = String(value).replace(/,/g, "");
  if (normalized.includes("T")) {
    return parseFloat(normalized.replace(/[$T]/g, "")) * 1000;
  }
  return parseFloat(normalized.replace(/[$B]/g, ""));
}

function formatMarketValue(billions) {
  if (!Number.isFinite(billions) || billions <= 0) {
    return "Estimate on request";
  }
  if (billions >= 1000) {
    return `$${(billions / 1000).toFixed(1)}T`;
  }
  return `$${billions.toFixed(1)}B`;
}

function createReport(seed, domainId, topicIndex, suffix, name, geoScope, region, country) {
  const id = `${domainId}-t${topicIndex}-${suffix}`;
  const baseValue = parseMarketValue(seed.value);
  const hash = hashCode(id);
  const scale = geoScope === "Global"
    ? 1
    : geoScope === "Regional"
      ? 0.28 + (hash % 18) / 100
      : 0.04 + (hash % 22) / 100;
  const value = formatMarketValue(baseValue * scale);
  const cagrValue = parseFloat(String(seed.cagr).replace("%", ""));
  const adjustedCagr = Number.isFinite(cagrValue)
    ? `${(cagrValue + ((hash % 7) - 3) * 0.4).toFixed(1)}%`
    : seed.cagr;

  return {
    id,
    name,
    value,
    cagr: adjustedCagr,
    year: seed.year,
    geoScope,
    region,
    country,
    topic: seed.name,
  };
}

export function buildExpandedCatalog(seedMarkets) {
  return Object.fromEntries(
    Object.entries(seedMarkets).map(([domainId, seeds]) => {
      const reports = [];

      seeds.forEach((seed, topicIndex) => {
        const core = seed.name.replace(/ Market$/, "");
        reports.push(createReport(seed, domainId, topicIndex, "g0", `Global ${core} Market`, "Global", null, null));

        GEO_REGIONS.forEach((region, regionIndex) => {
          reports.push(
            createReport(
              seed,
              domainId,
              topicIndex,
              `r${regionIndex}`,
              `${region} ${core} Market`,
              "Regional",
              region,
              null,
            ),
          );
        });

        for (let countryIndex = 0; countryIndex < 3; countryIndex += 1) {
          const country = GEO_COUNTRIES[(topicIndex + countryIndex) % GEO_COUNTRIES.length];
          reports.push(
            createReport(
              seed,
              domainId,
              topicIndex,
              `c${countryIndex}`,
              `${country} ${core} Market`,
              "Country",
              null,
              country,
            ),
          );
        }
      });

      return [domainId, reports];
    }),
  );
}
