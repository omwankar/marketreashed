import { useSEO } from "../hooks/useSEO.js";
import { PLATFORM_SEO, PLATFORM_KEYWORDS } from "../lib/platformData.js";
import { PlatformIntelligenceProvider } from "../context/PlatformIntelligenceContext.jsx";

import { HeroSection } from "../components/platform/HeroSection.jsx";
import { TrustedBy } from "../components/platform/TrustedBy.jsx";
import { PlatformOverview } from "../components/platform/PlatformOverview.jsx";
import { LiveTracking } from "../components/platform/LiveTracking.jsx";
import { AIInsightsEngine } from "../components/platform/AIInsightsEngine.jsx";
import { IndustriesGrid } from "../components/platform/IndustriesGrid.jsx";
import { PlatformCapabilities } from "../components/platform/PlatformCapabilities.jsx";
import { AIAgents } from "../components/platform/AIAgents.jsx";
import { DashboardPreview } from "../components/platform/DashboardPreview.jsx";
import { MetricsSection } from "../components/platform/MetricsSection.jsx";
import { Testimonials } from "../components/platform/Testimonials.jsx";
import { CTASection } from "../components/platform/CTASection.jsx";
import { PlatformFooter } from "../components/platform/PlatformFooter.jsx";

function PlatformContent() {
  useSEO({
    title: PLATFORM_SEO.title,
    description: PLATFORM_SEO.description,
    path: PLATFORM_SEO.path,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "InsightAxis AI Competitive Intelligence Platform",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: PLATFORM_SEO.description,
        keywords: PLATFORM_KEYWORDS.join(", "),
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          description: "Contact for enterprise pricing and demo",
        },
        provider: {
          "@type": "Organization",
          name: "InsightAxis Intelligence",
          url: "https://insightaxis-intelligence.com",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: PLATFORM_SEO.title,
        description: PLATFORM_SEO.description,
        url: `https://insightaxis-intelligence.com${PLATFORM_SEO.path}`,
        about: PLATFORM_KEYWORDS.map((k) => ({ "@type": "Thing", name: k })),
      },
    ],
  });

  return (
    <div className="platform-page min-h-screen">
      <HeroSection />
      <TrustedBy />
      <PlatformOverview />
      <LiveTracking />
      <AIInsightsEngine />
      <IndustriesGrid />
      <PlatformCapabilities />
      <AIAgents />
      <DashboardPreview />
      <MetricsSection />
      <Testimonials />
      <CTASection />
      <PlatformFooter />
    </div>
  );
}

export default function PlatformPage() {
  return (
    <PlatformIntelligenceProvider>
      <PlatformContent />
    </PlatformIntelligenceProvider>
  );
}
