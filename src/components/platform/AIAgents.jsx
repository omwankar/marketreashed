import { Bot } from "lucide-react";
import { motion } from "framer-motion";
import { AGENTS } from "../../lib/platformData.js";
import { usePlatformIntelligence } from "../../context/PlatformIntelligenceContext.jsx";
import { SparkArea } from "./Charts.jsx";
import { fadeUp, PltCard, PltHeading, PltSection, stagger } from "./shared.jsx";

export function AIAgents() {
  const { intel, loading, hasData, industryLabel } = usePlatformIntelligence();
  const outputs = intel.agentOutputs || [];
  const byId = Object.fromEntries(outputs.map((a) => [a.id, a]));

  return (
    <PltSection id="agents" dark className="overflow-hidden" ariaLabel="AI agents">
      <PltHeading
        eyebrow="Autonomous agents"
        title={`${industryLabel} AI Intelligence Agents`}
        subtitle="Live agent outputs for your selected industry — monitoring, analyzing, and briefing around the clock."
        center
      />
      <motion.div
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 md:grid md:grid-cols-3 lg:grid-cols-5 md:overflow-visible md:snap-none"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {AGENTS.map((agent) => {
          const live = byId[agent.id];
          return (
            <motion.div key={agent.id} variants={fadeUp} className="min-w-[260px] snap-center md:min-w-0">
              <PltCard className="relative overflow-hidden border-violet-500/20 !p-5 h-full !bg-gradient-to-br from-[#0f172a] to-[#1e1b4b]/40">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-violet-600/10 pointer-events-none" />
                <div className="relative flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <span className="absolute inset-0 rounded-full border border-blue-400/50 animate-plt-pulse-ring" />
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600">
                      <Bot className="h-8 w-8 text-white" aria-hidden />
                    </div>
                  </div>
                  <h3 className="font-display text-lg font-semibold text-white">{agent.title}</h3>
                  <p className="mt-2 text-xs text-slate-400">{agent.desc}</p>
                  <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {loading && !live ? "Syncing…" : live?.status || agent.status}
                  </span>
                  <ol className="mt-4 w-full space-y-1 text-left text-[11px] text-slate-500">
                    {agent.workflow.map((step, i) => (
                      <li key={step} className="flex items-center gap-2">
                        <span className="font-mono text-blue-400">{i + 1}</span> {step}
                      </li>
                    ))}
                  </ol>
                  <p className="mt-3 font-mono text-xs text-cyan-300">
                    {live?.metric || agent.metric}
                  </p>
                  {live?.lastInsight && (
                    <p className="mt-2 text-left text-[11px] leading-relaxed text-slate-300 w-full">
                      {live.lastInsight}
                    </p>
                  )}
                  {!live?.lastInsight && loading && !hasData && (
                    <p className="mt-2 text-[11px] text-slate-500">Awaiting agent output…</p>
                  )}
                  <div className="mt-3 w-full opacity-70">
                    <SparkArea
                      data={intel.momentumTrend?.slice(0, 3).map((p, i) => ({
                        month: p.label || `W${i + 1}`,
                        value: p.value || 40 + i * 10,
                      })) || [
                        { month: "a", value: 40 },
                        { month: "b", value: 65 },
                        { month: "c", value: 55 },
                      ]}
                      height={40}
                    />
                  </div>
                </div>
              </PltCard>
            </motion.div>
          );
        })}
      </motion.div>
    </PltSection>
  );
}
