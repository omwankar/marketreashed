import { Link } from "react-router-dom";
import { Mail, Share2 } from "lucide-react";
import { LINKEDIN_COMPANY_URL } from "../../hooks/useSEO.js";
import { PltSection } from "./shared.jsx";

const FOOTER_LINKS = {
  platform: [
    { label: "Overview", href: "#overview" },
    { label: "Live tracking", href: "#live-tracking" },
    { label: "AI engine", href: "#ai-insights" },
    { label: "Dashboard", href: "#dashboard" },
  ],
  industries: [
    { label: "FMCG", to: "/domains/fmcg" },
    { label: "Healthcare", to: "/domains/healthcare" },
    { label: "Technology", to: "/domains/technology" },
    { label: "Industrial", to: "/domains/industrial" },
  ],
  solutions: [
    { label: "AI Report Generator", to: "/generate" },
    { label: "Custom research", to: "/contact" },
    { label: "Market reports", to: "/domains" },
    { label: "Consulting", to: "/contact" },
  ],
  resources: [
    { label: "About", to: "/about" },
    { label: "Methodology", to: "/about" },
    { label: "Privacy", to: "/privacy" },
    { label: "Terms", to: "/terms" },
  ],
};

export function PlatformFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#060a14]">
      <PltSection className="!py-16" ariaLabel="Platform footer">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="font-display text-2xl font-bold text-white mb-3">InsightAxis Intelligence</p>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm mb-6">
              AI-powered competitive intelligence and market research for enterprise strategy, consulting, and investment teams.
            </p>
            <div className="flex gap-3">
              <a
                href={LINKEDIN_COMPANY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-blue-500/40"
                aria-label="LinkedIn"
              >
                <Share2 className="h-4 w-4" />
              </a>
              <Link
                to="/contact"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-blue-500/40"
                aria-label="Contact"
              >
                <Mail className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-mono text-[11px] uppercase tracking-widest text-slate-500 mb-4">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link to={link.to} className="text-sm text-slate-400 hover:text-blue-300 transition-colors">
                        {link.label}
                      </Link>
                    ) : (
                      <a href={link.href} className="text-sm text-slate-400 hover:text-blue-300 transition-colors">
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col md:flex-row gap-6 md:items-end md:justify-between">
          <div className="flex-1 max-w-md">
            <h4 className="font-mono text-[11px] uppercase tracking-widest text-slate-500 mb-3">Intelligence briefing</h4>
            <p className="text-xs text-slate-500 mb-3">Weekly AI market signals — enterprise subscribers only.</p>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                window.location.href = "/contact";
              }}
            >
              <input
                type="email"
                placeholder="Work email"
                aria-label="Email for newsletter"
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:outline-none"
              />
              <button type="submit" className="plt-btn-primary !py-2 !px-4 text-xs">
                Subscribe
              </button>
            </form>
          </div>
          <p className="text-xs text-slate-600">© {new Date().getFullYear()} InsightAxis Intelligence</p>
        </div>
      </PltSection>
    </footer>
  );
}
