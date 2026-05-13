// Convert a human-readable string into a URL-safe slug.
// "Plant-Based Food Market" → "plant-based-food-market"
// Used by the app routes and the build-time sitemap generator.
export function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}
