import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { AI_CAPABILITIES, AI_FLOW_STEPS } from "../../lib/platformData.js";
import { usePlatformIntelligence } from "../../context/PlatformIntelligenceContext.jsx";
import { fadeUp, PltCard, PltHeading, PltReveal, PltSection, stagger } from "./shared.jsx";

export function AIInsightsEngine() {
  const { intel } = usePlatformIntelligence();

  return (
    <PltSection id="ai-insights" dark className="plt-spotlight overflow-hidden" ariaLabel="AI insights engine">
      <svg className="absolute inset-0 w-full h-full opacity-[0.08] pointer-events-none" aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none">
        {[
          [15, 25, 45, 15],
          [45, 15, 75, 35],
          [75, 35, 60, 55],
          [30, 65, 60, 55],
          [60, 55, 85, 70],
          [15, 25, 30, 65],
        ].map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#6366f1" strokeWidth="0.3" />
        ))}
        {[
          [15, 25],
          [45, 15],
          [75, 35],
          [30, 65],
          [60, 55],
          [85, 70],
        ].map(([cx, cy], i) => (
          <circle key={`n-${i}`} cx={cx} cy={cy} r="1.5" fill="#818cf8" />
        ))}
      </svg>

      <PltHeading
        eyebrow="AI engine"
        title="AI That Converts Data Into Strategy"
        subtitle={intel.executiveSummary}
        center
      />

      <motion.ol
        className="mb-16 flex flex-wrap justify-center items-center gap-2 md:gap-3"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {AI_FLOW_STEPS.map((step, i) => (
          <motion.li key={step} variants={fadeUp} className="flex items-center gap-2">
            <span className={`rounded-lg px-3 py-2 text-xs md:text-sm font-medium ${i === 1 ? "bg-blue-600/30 text-blue-100 border border-blue-500/40" : "plt-glass text-slate-300"}`}>
              {step}
            </span>
            {i < AI_FLOW_STEPS.length - 1 && <ArrowRight className="h-4 w-4 text-slate-600 hidden sm:block" />}
          </motion.li>
        ))}
      </motion.ol>

      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {AI_CAPABILITIES.map((cap) => (
          <motion.div key={cap.title} variants={fadeUp}>
            <PltCard>
              <h3 className="font-display text-lg font-semibold text-white">{cap.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{cap.desc}</p>
            </PltCard>
          </motion.div>
        ))}
      </motion.div>

      <PltReveal className="mt-12" delay={0.1}>
        <div className="plt-panel p-6">
          <p className="font-mono text-xs text-violet-300 mb-2">Strategic recommendations (AI)</p>
          <ul className="grid gap-2 md:grid-cols-3">
            {(intel.recommendations || []).map((rec, i) => (
              <li key={`rec-${i}`} className="text-sm text-slate-300 plt-glass rounded-lg px-3 py-2 border-l-2 border-blue-500">
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </PltReveal>
    </PltSection>
  );
}
