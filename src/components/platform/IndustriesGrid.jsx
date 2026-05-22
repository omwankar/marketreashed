import { motion } from "framer-motion";
import { INDUSTRIES } from "../../lib/platformData.js";
import { SparkLine } from "./Charts.jsx";
import { fadeUp, PltCard, PltHeading, PltSection, stagger } from "./shared.jsx";

export function IndustriesGrid() {
  return (
    <PltSection id="industries" className="bg-[#0a0f1e]/50" ariaLabel="Industries">
      <PltHeading
        eyebrow="Vertical intelligence"
        title="Built for Intelligence-Driven Industries"
        subtitle="Pre-configured models and competitor universes by sector."
        center
      />
      <motion.div
        className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {INDUSTRIES.map((ind) => (
          <motion.div key={ind.id} variants={fadeUp}>
            <PltCard className="!p-4 h-full group">
              <span className="text-3xl" role="img" aria-label={ind.name}>
                {ind.icon}
              </span>
              <h3 className="mt-3 font-display text-sm font-semibold text-white group-hover:text-cyan-200 transition-colors">
                {ind.name}
              </h3>
              <p className="mt-1 text-[11px] text-slate-500 leading-snug">{ind.hook}</p>
              <div className="mt-3 opacity-80">
                <SparkLine data={ind.data} color="#22d3ee" height={36} />
              </div>
            </PltCard>
          </motion.div>
        ))}
      </motion.div>
    </PltSection>
  );
}
