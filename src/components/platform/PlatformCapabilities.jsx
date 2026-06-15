import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CAPABILITY_TABS } from "../../lib/platformData.js";
import { usePlatformIntelligence } from "../../context/PlatformIntelligenceContext.jsx";
import {
  CompareBar,
  DashboardAreaChart,
  PositionRadar,
  SharePie,
} from "./Charts.jsx";
import { PltHeading, PltReveal, PltSection } from "./shared.jsx";

const priceCompare = [
  { name: "You", value: 100 },
  { name: "Comp A", value: 92 },
  { name: "Comp B", value: 88 },
];

function TabPanel({ tabId, recommendations, intel }) {
  switch (tabId) {
    case "monitor":
      return <DashboardAreaChart data={intel.signalTrend} height={240} />;
    case "competitor":
      return (
        <PositionRadar
          data={[
            { subject: "Innovation", A: 88, B: 72 },
            { subject: "Price", A: 76, B: 84 },
            { subject: "Scale", A: 90, B: 65 },
          ]}
        />
      );
    case "brief":
      return (
        <div className="plt-glass rounded-xl p-6 text-sm text-slate-300 leading-relaxed">
          <p className="font-mono text-xs text-blue-300 mb-3">Executive Brief · AI</p>
          <p>
            <strong className="text-white">Summary:</strong> {intel.executiveSummary || "Awaiting AI sync."}
          </p>
          <p className="mt-3 text-slate-500">Confidence: {intel.confidence || "—"}</p>
        </div>
      );
    case "signals":
      return (
        <ul className="space-y-2 text-sm">
          {(intel.notifications?.length ? intel.notifications : intel.alerts || []).map((s, i) => (
            <li key={`signal-${i}`} className="plt-glass rounded-lg px-3 py-2 text-slate-300">
              {s}
            </li>
          ))}
        </ul>
      );
    case "trade":
      return <SharePie data={[{ name: "Imports", value: 55 }, { name: "Exports", value: 45 }]} />;
    case "sentiment":
      return (
        <div className="flex items-center justify-center gap-6 py-8">
          <div className="text-center">
            <div className="text-4xl font-display font-bold text-emerald-400">72%</div>
            <div className="text-xs text-slate-500">Positive</div>
          </div>
          <div className="h-24 w-2 rounded-full bg-gradient-to-t from-red-500 via-amber-400 to-emerald-400" />
        </div>
      );
    case "dist":
      return (
        <div className="flex h-48 items-center justify-center text-slate-500 text-sm border border-dashed border-white/10 rounded-xl">
          Distributor network graph · 240 nodes
        </div>
      );
    case "price":
      return <CompareBar data={priceCompare} />;
    case "invest":
      return (
        <DashboardAreaChart
          data={[
            { month: "Q1", signals: 12 },
            { month: "Q2", signals: 18 },
            { month: "Q3", signals: 24 },
            { month: "Q4", signals: 31 },
          ]}
        />
      );
    case "strategy":
      return (
        <div className="grid gap-3">
          {(recommendations || []).slice(0, 3).map((r, i) => (
            <div key={`rec-${i}`} className="plt-glass rounded-lg px-4 py-3 text-sm text-slate-200 border-l-2 border-blue-500">
              {r}
            </div>
          ))}
        </div>
      );
    default:
      return null;
  }
}

export function PlatformCapabilities() {
  const [active, setActive] = useState(CAPABILITY_TABS[0].id);
  const { intel } = usePlatformIntelligence();
  const current = CAPABILITY_TABS.find((t) => t.id === active) || CAPABILITY_TABS[0];

  return (
    <PltSection id="capabilities" ariaLabel="Platform capabilities">
      <PltHeading
        eyebrow="Enterprise modules"
        title="Enterprise-Grade Capabilities at Scale"
        subtitle="Modular intelligence modules activated per team and geography."
        center
      />
      <div className="grid gap-8 lg:grid-cols-12">
        <nav
          className="lg:col-span-4 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0"
          aria-label="Capability tabs"
        >
          {CAPABILITY_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={`shrink-0 rounded-lg px-4 py-3 text-left text-sm transition-all ${
                active === tab.id
                  ? "bg-blue-600/25 text-blue-100 border border-blue-500/40 shadow-lg shadow-blue-900/30"
                  : "text-slate-400 hover:bg-white/5 border border-transparent"
              }`}
              aria-current={active === tab.id ? "true" : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="lg:col-span-8 plt-panel rounded-2xl p-6 min-h-[320px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.35 }}
            >
              <h3 className="font-display text-xl text-white mb-1">{current.title}</h3>
              <p className="text-sm text-slate-400 mb-6">{current.insight}</p>
              <TabPanel tabId={active} recommendations={intel.recommendations} intel={intel} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </PltSection>
  );
}
