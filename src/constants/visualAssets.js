export const HERO_IMAGE =
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=85";

export const ABOUT_IMAGE =
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=80";

export const DEFAULT_REPORT_IMAGE =
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80";

export const DOMAIN_IMAGES = {
  fnb: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
  healthcare: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80",
  technology: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80",
  automotive: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=600&q=80",
  energy: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&q=80",
  industrial: "https://images.unsplash.com/photo-1565106430482-8f6e74349ca1?w=600&q=80",
  finance: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80",
  consumer: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80",
  chemicals: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&q=80",
  fmcg: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&q=80",
  construction: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80",
};

export function getDomainImage(domainId) {
  return DOMAIN_IMAGES[domainId] || DEFAULT_REPORT_IMAGE;
}

export function getMarketDomainId(market) {
  if (!market?.id) return null;
  const prefix = String(market.id).split("-")[0];
  return DOMAIN_IMAGES[prefix] ? prefix : null;
}
