import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { bookDemoContact } from "../../constants/contactLinks.js";
import { usePlatformIntelligence } from "../../context/PlatformIntelligenceContext.jsx";
import { PltReveal, PltSection } from "./shared.jsx";

export function CTASection() {
  const { industryLabel } = usePlatformIntelligence();

  return (
    <PltSection id="cta" className="!pb-8" ariaLabel="Call to action">
      <PltReveal>
        <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 plt-grid-bg px-6 py-20 md:px-14">
          <div className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-blue-600/25 blur-[100px]" />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-violet-600/20 blur-[100px]" />
          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight">
              Turn Market Intelligence Into Competitive Advantage
            </h2>
            <p className="mt-5 text-lg text-slate-400">
              Empower your organization with AI-driven {industryLabel} intelligence.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link to={bookDemoContact({ industryLabel })} className="plt-btn-primary">
                Schedule Demo <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/contact?intent=consultation&subject=Radar Consultation" className="plt-btn-ghost">
                Request Consultation
              </Link>
            </div>
          </div>
        </div>
      </PltReveal>
    </PltSection>
  );
}
