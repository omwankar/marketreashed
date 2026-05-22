import { Activity, Bell, Brain, DollarSign, LayoutDashboard, TrendingUp } from "lucide-react";
import { OVERVIEW_FEATURES } from "../../lib/platformData.js";
import { usePlatformIntelligence } from "../../context/PlatformIntelligenceContext.jsx";
import { SparkArea, SparkBar, SparkLine } from "./Charts.jsx";
import { PltCard, PltHeading, PltIconBox, PltSection } from "./shared.jsx";

const iconMap = { Radar: Activity, Bell, TrendingUp, DollarSign, Brain, LayoutDashboard };

function chartForFeature(intel, index) {
  const base = intel.momentumTrend || [];
  if (!base.length) return [];
  const scale = 0.75 + index * 0.04;
  return base.map((p, i) => ({
    month: p.label || p.month,
    value: Math.min(100, Math.round((p.value || 0) * scale + (i % 3) * 2)),
  }));
}

function MiniChart({ type, data }) {
  if (!data?.length) return <div className="plt-chart-empty" style={{ height: 52 }} />;
  if (type === "bar") return <SparkBar data={data} color="#8b5cf6" height={52} />;
  if (type === "area") return <SparkArea data={data} color="#22d3ee" height={52} />;
  return <SparkLine data={data} color="#3b82f6" height={52} />;
}

export function PlatformOverview() {
  const { intel } = usePlatformIntelligence();

  return (
    <PltSection id="overview" ariaLabel="Platform overview">
      <PltHeading
        eyebrow="Unified platform"
        title="One Unified Intelligence Platform"
        subtitle="Every signal. Every competitor. Every insight — in a single enterprise command layer."
        center
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {OVERVIEW_FEATURES.map((f, index) => {
          const Icon = iconMap[f.icon] || Activity;
          const data = intel.momentumTrend?.length ? chartForFeature(intel, index) : [];
          return (
            <PltCard key={f.id} className="h-full flex flex-col">
              <PltIconBox>
                <Icon className="h-5 w-5 text-white" aria-hidden />
              </PltIconBox>
              <h3 className="mt-5 font-display text-xl font-semibold text-white">{f.title}</h3>
              <p className="mt-2 flex-1 text-sm text-slate-400 leading-relaxed">{f.description}</p>
              <div className="mt-5 pt-4 border-t border-white/[0.06]">
                <MiniChart type={f.chartType} data={data} />
              </div>
            </PltCard>
          );
        })}
      </div>
    </PltSection>
  );
}
