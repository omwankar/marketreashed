import { Newspaper } from "lucide-react";
import { usePlatformIntelligence } from "../../context/PlatformIntelligenceContext.jsx";
import { PltHeading, PltReveal, PltSection, PltSkeleton } from "./shared.jsx";

export function IndustryNewsFeed() {
  const { intel, loading, hasData, industryLabel } = usePlatformIntelligence();
  const news = intel.newsFeed || [];

  return (
    <PltSection id="industry-news" dark ariaLabel="Industry news feed">
      <PltHeading
        eyebrow="Live news"
        title={`${industryLabel} — AI News & Signals`}
        subtitle="Recent industry headlines and competitive moves synthesized by AI agents."
      />
      <PltReveal>
        <div className="plt-panel plt-news-feed">
          <div className="plt-news-feed__head">
            <Newspaper className="h-4 w-4 text-blue-400" aria-hidden />
            <span>Realtime feed · updated on refresh</span>
          </div>
          {loading && !hasData ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <PltSkeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : news.length ? (
            <ul className="plt-news-list">
              {news.map((item, i) => (
                <li key={`${item.headline}-${i}`} className="plt-news-item">
                  <div className="plt-news-item__meta">
                    <span className="plt-news-item__time">{item.time || "Recent"}</span>
                    {item.source && <span className="plt-news-item__source">{item.source}</span>}
                  </div>
                  <p className="plt-news-item__headline">{item.headline}</p>
                  {item.summary && <p className="plt-news-item__summary">{item.summary}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="plt-chart-empty-text">Refresh Radar to load industry news.</p>
          )}
        </div>
      </PltReveal>
    </PltSection>
  );
}
