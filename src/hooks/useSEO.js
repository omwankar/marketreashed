// Dynamic per-route SEO. Updates document head metadata (title, description,
// canonical, Open Graph, Twitter Card) and injects/replaces JSON-LD blocks.
//
// Usage:
//   useSEO({
//     title: "...",
//     description: "...",
//     path: "/about",                // route path appended to SITE_URL
//     image: "https://insightaxis-intelligence.com/og-image.png",  // optional override
//     jsonLd: [{ "@context": "https://schema.org", "@type": "Article", ... }],
//   });
//
// Notes
// - `title` and `description` are required for every page.
// - `path` defaults to `/` and is used to compute the canonical URL.
// - `jsonLd` may be a single object or an array. Each block is rendered as a
//   <script type="application/ld+json" data-seo-jsonld> element. Existing
//   per-page blocks (matching data-seo-jsonld) are removed on each call so
//   stale schemas don't accumulate when the user navigates between pages.

import { useEffect } from "react";

export const SITE_URL = "https://insightaxis-intelligence.com";
export const SITE_NAME = "InsightAxis Intelligence";
export const LINKEDIN_COMPANY_URL = "https://www.linkedin.com/company/insightaxisintelligence/";
export const OG_IMAGE_URL = `${SITE_URL}/og-image.png`;
export const TWITTER_HANDLE = "@InsightAxisIntel";

const META_BINDINGS = [
  { selector: 'meta[name="description"]', attr: "content", key: "description" },
  { selector: 'meta[property="og:title"]', attr: "content", key: "title" },
  { selector: 'meta[property="og:description"]', attr: "content", key: "description" },
  { selector: 'meta[property="og:url"]', attr: "content", key: "url" },
  { selector: 'meta[property="og:image"]', attr: "content", key: "image" },
  { selector: 'meta[property="og:image:alt"]', attr: "content", key: "title" },
  { selector: 'meta[name="twitter:title"]', attr: "content", key: "title" },
  { selector: 'meta[name="twitter:description"]', attr: "content", key: "description" },
  { selector: 'meta[name="twitter:image"]', attr: "content", key: "image" },
  { selector: 'meta[name="twitter:image:alt"]', attr: "content", key: "title" },
];

function ensureMeta(selector, createAttrs) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    Object.entries(createAttrs).forEach(([k, v]) => el.setAttribute(k, v));
    document.head.appendChild(el);
  }
  return el;
}

function ensureCanonical() {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  return el;
}

function clearJsonLd() {
  document.head
    .querySelectorAll('script[type="application/ld+json"][data-seo-jsonld]')
    .forEach((node) => node.remove());
}

function injectJsonLd(blocks) {
  if (!blocks) return;
  const items = Array.isArray(blocks) ? blocks : [blocks];
  items.forEach((block) => {
    if (!block) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-seo-jsonld", "true");
    try {
      script.text = JSON.stringify(block);
      document.head.appendChild(script);
    } catch {
      /* swallow malformed JSON-LD instead of crashing the page */
    }
  });
}

function applyMeta(values) {
  META_BINDINGS.forEach(({ selector, attr, key }) => {
    const value = values[key];
    if (value == null) return;
    const isOg = selector.startsWith('meta[property=');
    const propName = isOg
      ? selector.match(/property="([^"]+)"/)[1]
      : selector.match(/name="([^"]+)"/)[1];
    const createAttrs = isOg ? { property: propName } : { name: propName };
    const el = ensureMeta(selector, createAttrs);
    el.setAttribute(attr, String(value));
  });
}

export function useSEO({
  title,
  description,
  path = "/",
  image,
  jsonLd,
} = {}) {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const url = `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
    const resolvedImage = image || OG_IMAGE_URL;

    if (title) document.title = title;

    applyMeta({
      title,
      description,
      url,
      image: resolvedImage,
    });

    const canonical = ensureCanonical();
    canonical.setAttribute("href", url);

    clearJsonLd();
    injectJsonLd(jsonLd);

    // No cleanup: the next route's useSEO call will overwrite the same tags.
    // Removing them on unmount would briefly flash empty metadata.
  }, [title, description, path, image, JSON.stringify(jsonLd)]);
}

// Schema helpers — reused by App.jsx and MordorReport.jsx ---------------------

export function buildBreadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url.startsWith("http") ? it.url : `${SITE_URL}${it.url}`,
    })),
  };
}

export function buildReportSchema({ name, description, datePublished, marketName }) {
  return {
    "@context": "https://schema.org",
    "@type": "Report",
    name,
    description,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.svg`,
    },
    datePublished: datePublished || new Date().toISOString().slice(0, 10),
    inLanguage: "en",
    about: marketName
      ? { "@type": "Thing", name: marketName }
      : undefined,
  };
}

export function buildFaqSchema(faqs) {
  if (!Array.isArray(faqs) || !faqs.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };
}
