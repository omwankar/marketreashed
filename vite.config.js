import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { MARKET_SEEDS } from "./src/data/marketSeeds.js";
import { buildExpandedCatalog } from "./src/marketCatalog.js";
import { slugify } from "./src/utils/slugify.js";

const SITE_URL = "https://insightaxis.com";

// Domain id → human-readable label (kept in sync with DOMAINS in src/App.jsx).
const DOMAIN_LABELS = {
  fnb: "Food & Beverage",
  consumer: "Consumer Goods",
  fmcg: "FMCG",
  healthcare: "Healthcare",
  industrial: "Industrial",
  technology: "Technology",
  energy: "Energy & Utilities",
  automotive: "Automotive",
  chemicals: "Chemicals",
  finance: "Financial Services",
};

function buildSitemapXml() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [];

  const pushUrl = (loc, priority, changefreq = "weekly") => {
    urls.push({ loc, lastmod: today, changefreq, priority });
  };

  pushUrl(`${SITE_URL}/`, "1.0", "daily");
  pushUrl(`${SITE_URL}/about`, "0.7", "monthly");
  pushUrl(`${SITE_URL}/domains`, "0.9", "weekly");
  pushUrl(`${SITE_URL}/generate`, "0.8", "weekly");
  pushUrl(`${SITE_URL}/contact`, "0.6", "monthly");

  Object.keys(DOMAIN_LABELS).forEach((domainId) => {
    pushUrl(`${SITE_URL}/domains/${domainId}`, "0.8", "weekly");
  });

  const catalog = buildExpandedCatalog(MARKET_SEEDS);
  Object.values(catalog).forEach((reports) => {
    reports.forEach((report) => {
      const slug = slugify(report.name);
      if (!slug) return;
      pushUrl(`${SITE_URL}/markets/${slug}`, "0.7", "monthly");
    });
  });

  const body = urls
    .map(
      (u) =>
        `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

// Vite plugin: emit a sitemap.xml into the build output at every build,
// and serve it from the dev server during development.
function sitemapPlugin() {
  return {
    name: "insightaxis-sitemap",
    apply: undefined,
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === "/sitemap.xml") {
          res.setHeader("Content-Type", "application/xml; charset=utf-8");
          res.end(buildSitemapXml());
          return;
        }
        next();
      });
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: buildSitemapXml(),
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), sitemapPlugin()],
});
