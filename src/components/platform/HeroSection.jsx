import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Globe2, Radar, TrendingUp } from "lucide-react";
import { usePlatformIntelligence } from "../../context/PlatformIntelligenceContext.jsx";
import { bookDemoContact } from "../../constants/contactLinks.js";
import { AiIntelStrip } from "./AiIntelStrip.jsx";
import { SparkArea, SparkLine } from "./Charts.jsx";
import { PltBadge } from "./shared.jsx";

export function HeroSection() {
  const { intel, loading, hasData, industryLabel } = usePlatformIntelligence();
  const alerts = intel.alerts || [];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!alerts.length) return undefined;
    const t = setInterval(() => setIdx((n) => (n + 1) % alerts.length), 6000);
    return () => clearInterval(t);
  }, [alerts.length]);

  const kpis = [
    { label: "Signals today", value: intel.kpis?.signalsToday ?? "—", icon: BarChart3, color: "#3b82f6" },
    { label: "Regions", value: String(intel.kpis?.regions ?? "—"), icon: Globe2, color: "#22d3ee" },
    { label: "Alerts", value: String(intel.kpis?.alerts ?? "—"), icon: Radar, color: "#a78bfa" },
  ];

  return (
    <header className="plt-hero plt-grid-bg plt-spotlight">
      <AiIntelStrip />

      <div className="plt-hero__glow plt-hero__glow--left" aria-hidden />
      <div className="plt-hero__glow plt-hero__glow--right" aria-hidden />

      <div className="plt-hero__grid">
        <div className="plt-hero__copy plt-fade-in">
          <PltBadge live={hasData && !loading}>Enterprise AI Intelligence</PltBadge>

          <h1 className="plt-hero__title">
            <span className="plt-gradient-text">AI-Powered</span>
            <br />
            Competitive Intelligence Platform
          </h1>

          <p className="plt-hero__subtitle">
            Transform {industryLabel} market signals, competitor activity, and industry news into strategic decisions with real-time AI intelligence.
          </p>

          <div className="plt-hero__actions">
            <Link to={bookDemoContact({ industryLabel })} className="plt-btn-primary">
              Book Demo <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <a href="#overview" className="plt-btn-ghost">Explore Radar</a>
          </div>

          <p className="plt-hero__proof">
            Trusted by <strong>200+</strong> enterprise strategy teams worldwide
          </p>
        </div>

        <div className="plt-hero__visual plt-fade-in plt-fade-in--delay">
          <div className="plt-command-panel">
            <div className="plt-command-bar">
              <span className="plt-command-bar__title">
                <Radar className="h-3.5 w-3.5 text-blue-400" aria-hidden />
                Intelligence Command
              </span>
              <span className="plt-status-live">{loading ? "Syncing" : "Live"}</span>
            </div>

            <div className="plt-command-kpis">
              {kpis.map((k) => (
                <div key={k.label} className="plt-kpi-card">
                  <k.icon className="h-4 w-4" style={{ color: k.color }} aria-hidden />
                  <p className="plt-kpi-card__value">{loading && !hasData ? "…" : k.value}</p>
                  <p className="plt-kpi-card__label">{k.label}</p>
                </div>
              ))}
            </div>

            <div className="plt-command-charts">
              <div className="plt-chart-box">
                <p className="plt-chart-box__label">
                  <TrendingUp className="h-3 w-3" aria-hidden /> Market momentum
                </p>
                <div className="plt-chart-box__canvas">
                  <SparkArea data={intel.momentumTrend} color="#3b82f6" height={72} />
                </div>
              </div>
              <div className="plt-chart-box">
                <p className="plt-chart-box__label">Competitive velocity</p>
                <div className="plt-chart-box__canvas">
                  <SparkLine data={intel.velocityTrend} color="#22d3ee" height={72} />
                </div>
              </div>
            </div>

            <div className="plt-command-feed">
              <p className="plt-chart-box__label">Competitor feed (AI)</p>
              {intel.competitorFeed?.length ? (
                <ul>
                  {intel.competitorFeed.map((r, i) => (
                    <li key={`feed-${i}-${String(r).slice(0, 40)}`}>
                      <span className="plt-feed-dot" aria-hidden /> {r}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="plt-chart-empty-text">{loading ? "Generating feed…" : "Awaiting AI sync"}</p>
              )}
            </div>
          </div>

          {alerts.length > 0 && (
            <div className="plt-hero-alert">
              <p className="plt-hero-alert__pill" key={idx}>
                {loading ? "Loading AI alert stream…" : alerts[idx]}
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
