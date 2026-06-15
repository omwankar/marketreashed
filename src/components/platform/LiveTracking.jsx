import { useEffect, useState } from "react";
import { Brain, RefreshCw } from "lucide-react";
import { usePlatformIntelligence } from "../../context/PlatformIntelligenceContext.jsx";
import { IntensityBarChart, TrendAreaChart } from "./Charts.jsx";
import { PltHeading, PltReveal, PltSection, PltSkeleton } from "./shared.jsx";

export function LiveTracking() {
  const { intel, loading, refreshing, refresh, hasData } = usePlatformIntelligence();
  const notifications = intel.notifications || [];
  const [toastIdx, setToastIdx] = useState(0);

  useEffect(() => {
    if (!notifications.length) return undefined;
    const t = setInterval(() => setToastIdx((n) => (n + 1) % notifications.length), 5000);
    return () => clearInterval(t);
  }, [notifications.length]);

  return (
    <PltSection id="live-tracking" dark ariaLabel="Live competitor tracking">
      <PltHeading
        eyebrow="Real-time monitoring"
        title="Live Competitor Intelligence Feed"
        subtitle="Launches, pricing, hiring, M&A, and regional moves — synthesized into executive-ready insight."
      />

      <div className="plt-live-grid">
        <div className="plt-panel plt-live-timeline">
          <h3 className="plt-section-label">Event timeline (AI)</h3>
          {loading && !hasData ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <PltSkeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : intel.timeline?.length ? (
            <ul className="plt-timeline-list">
              {intel.timeline.map((ev) => (
                <li key={ev.id} className="plt-timeline-item" style={{ borderColor: ev.color }}>
                  <div className="plt-timeline-meta">
                    <span className="plt-timeline-time">{ev.time}</span>
                    <span className="plt-timeline-tag" style={{ background: `${ev.color}22`, color: ev.color }}>
                      {ev.category}
                    </span>
                  </div>
                  <p className="plt-timeline-desc">{ev.description}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="plt-chart-empty-text">Select an industry and refresh to load the live timeline.</p>
          )}
        </div>

        <div className="plt-live-charts">
          <PltReveal>
            <div className="plt-panel plt-chart-panel">
              <p className="plt-section-label">Market share trajectory (AI)</p>
              <TrendAreaChart data={intel.marketShareTrend} height={200} />
            </div>
          </PltReveal>

          <PltReveal delay={0.05}>
            <div className="plt-panel plt-chart-panel">
              <p className="plt-section-label">Activity intensity · 7-day (AI)</p>
              <IntensityBarChart data={intel.activityByDay} height={128} />
            </div>
          </PltReveal>

          <PltReveal delay={0.08}>
            <div className="plt-panel plt-insight-panel">
              <div className="plt-insight-panel__head">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-violet-400" aria-hidden />
                  <p className="plt-section-label" style={{ margin: 0 }}>AI-generated insight</p>
                </div>
                <button
                  type="button"
                  onClick={refresh}
                  disabled={loading || refreshing}
                  className="plt-link-btn"
                >
                  <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
                  Regenerate
                </button>
              </div>
              {loading && !intel.strategicInsight ? (
                <PltSkeleton className="h-20 w-full" />
              ) : (
                <>
                  <p className="plt-insight-body">{intel.strategicInsight}</p>
                  {intel.riskSignal && <p className="plt-insight-risk">{intel.riskSignal}</p>}
                  <p className="plt-insight-meta">
                    Confidence: {intel.confidence} ·{" "}
                    {intel.provider === "groq"
                      ? "Groq · DeepSeek R1"
                      : intel.provider === "nvidia"
                        ? "NVIDIA"
                        : intel.provider === "gemini"
                          ? "Gemini"
                          : intel.source}
                  </p>
                </>
              )}
            </div>
          </PltReveal>

          {notifications.length > 0 && (
            <div className="plt-live-toast" aria-live="polite">
              <span>⚠</span> {notifications[toastIdx]}
            </div>
          )}
        </div>
      </div>
    </PltSection>
  );
}
