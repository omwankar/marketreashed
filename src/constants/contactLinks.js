/** Contact URLs with pre-filled query params for Radar CTAs */

export function bookDemoContact(opts = {}) {
  const { industryLabel = "", source = "Radar" } = opts;
  const params = new URLSearchParams({
    intent: "book-demo",
    subject: "Radar Demo Request",
    message: industryLabel
      ? `I would like to book a ${source} demo focused on ${industryLabel} competitive intelligence.`
      : `I would like to book an InsightAxis ${source} demo.`,
  });
  return `/contact?${params.toString()}`;
}

export function customIndustryContact() {
  const params = new URLSearchParams({
    intent: "custom-industry",
    subject: "Custom Radar Industry Coverage",
    message:
      "I need Radar configured for a custom industry vertical not listed in the slicer. Please contact me to discuss coverage, data sources, and enterprise pricing.",
  });
  return `/contact?${params.toString()}`;
}
