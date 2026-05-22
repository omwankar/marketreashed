import { Bell } from "lucide-react";
import { PIE_SHARE, RADAR_DATA } from "../../lib/platformData.js";
import { usePlatformIntelligence } from "../../context/PlatformIntelligenceContext.jsx";
import { DashboardAreaChart, PositionRadar, SharePie } from "./Charts.jsx";
import { PltBadge, PltHeading, PltReveal, PltSection } from "./shared.jsx";

export function DashboardPreview() {
  const { intel, isLive, loading, hasData } = usePlatformIntelligence();
  const kpis = intel.dashboardKpis?.length ? intel.dashboardKpis : [];
  const recs = (intel.recommendations || []).map((body, i) => ({
    title: `AI recommendation ${i + 1}`,
    body,
  }));
  const table = intel.competitorTable?.length ? intel.competitorTable : [];

  return (
    <PltSection id="dashboard" className="bg-[#070b14]/80" ariaLabel="Dashboard preview">
      <PltHeading
        eyebrow="Command center"
        title="Your Intelligence Command Center"
        subtitle="One workspace for signals, share, predictive charts, and AI recommendations."
        center
      />

      <PltReveal>
        <div className="plt-panel rounded-2xl overflow-hidden">
          <div className="plt-dash-toolbar">
            <span className="font-mono text-xs text-slate-400">Intelligence OS · Enterprise</span>
            <div className="flex flex-wrap items-center gap-2">
              <PltBadge live={isLive && hasData}>{isLive && hasData ? "Live AI feed" : loading ? "Syncing…" : "Awaiting AI"}</PltBadge>
            </div>
          </div>

          {kpis.length > 0 && (
            <div className="plt-dash-kpis">
              {kpis.map((kpi) => (
                <div key={kpi.label} className="plt-glass rounded-xl p-4">
                  <p className="text-xs text-slate-500">{kpi.label}</p>
                  <p className="font-display text-2xl font-bold text-white mt-1">{kpi.value}</p>
                  <p className="text-[10px] text-slate-600">{kpi.sub}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-4 p-4 lg:grid-cols-3">
            <div className="lg:col-span-2 plt-glass rounded-xl p-4">
              <p className="plt-section-label">Signal volume (AI)</p>
              <DashboardAreaChart data={intel.signalTrend} height={240} />
            </div>
            <div className="space-y-4">
              <div className="plt-glass rounded-xl p-4">
                <p className="plt-section-label">Competitive positioning</p>
                <PositionRadar data={RADAR_DATA} />
              </div>
              <div className="plt-glass rounded-xl p-4">
                <p className="plt-section-label">Market share</p>
                <SharePie data={PIE_SHARE} />
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-4 pt-0 lg:grid-cols-3">
            <div className="lg:col-span-2 plt-glass rounded-xl p-4 overflow-x-auto">
              <p className="plt-section-label">Competitor activity (AI)</p>
              {table.length ? (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-slate-500 text-xs border-b border-white/10">
                      <th className="pb-2 pr-4">Competitor</th>
                      <th className="pb-2 pr-4">Activity</th>
                      <th className="pb-2 pr-4">Change</th>
                      <th className="pb-2">Region</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.map((row) => (
                      <tr key={row.name} className="border-b border-white/5 text-slate-300">
                        <td className="py-2 pr-4">{row.name}</td>
                        <td className="py-2 pr-4">{row.activity}</td>
                        <td className={`py-2 pr-4 ${String(row.change).startsWith("+") ? "text-emerald-400" : "text-red-400"}`}>
                          {row.change}
                        </td>
                        <td className="py-2">{row.region}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="plt-chart-empty-text">{loading ? "Loading…" : "No competitor table until AI sync completes."}</p>
              )}
            </div>
            <div className="space-y-3">
              <p className="plt-section-label flex items-center gap-2">
                <Bell className="h-3.5 w-3.5" aria-hidden /> AI recommendations
              </p>
              {recs.length ? (
                recs.map((rec) => (
                  <div key={rec.title} className="plt-glass rounded-xl p-3 border-l-2 border-amber-500/50">
                    <p className="text-sm font-medium text-white">{rec.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{rec.body}</p>
                  </div>
                ))
              ) : (
                <p className="plt-chart-empty-text">{loading ? "Generating…" : "Awaiting AI recommendations"}</p>
              )}
            </div>
          </div>
        </div>
      </PltReveal>
    </PltSection>
  );
}
