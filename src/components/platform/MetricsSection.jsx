import * as Lucide from "lucide-react";
import { motion } from "framer-motion";
import { METRICS } from "../../lib/platformData.js";
import { CountUp } from "./CountUp.jsx";
import { fadeUp, PltCard, PltHeading, PltSection, stagger } from "./shared.jsx";

export function MetricsSection() {
  return (
    <PltSection id="why-us" ariaLabel="Why choose us">
      <PltHeading
        eyebrow="Proven at scale"
        title="Why Choose InsightAxis Intelligence"
        subtitle="Enterprise-grade signal processing trusted by global strategy and intelligence teams."
        center
      />
      <motion.div
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {METRICS.map((m) => {
          const Icon = Lucide[m.icon] || Lucide.Activity;
          return (
            <motion.div key={m.label} variants={fadeUp}>
              <PltCard className="text-center !py-8">
                <Icon className="mx-auto h-7 w-7 text-blue-400 mb-4" aria-hidden />
                <CountUp value={m.value} suffix={m.suffix} />
                <p className="mt-4 text-sm text-slate-400 leading-snug">{m.label}</p>
              </PltCard>
            </motion.div>
          );
        })}
      </motion.div>
    </PltSection>
  );
}
