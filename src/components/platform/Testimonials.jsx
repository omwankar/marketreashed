import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { TESTIMONIALS } from "../../lib/platformData.js";
import { fadeUp, PltCard, PltHeading, PltSection, stagger } from "./shared.jsx";

export function Testimonials() {
  return (
    <PltSection id="testimonials" dark ariaLabel="Testimonials">
      <PltHeading
        eyebrow="Enterprise voices"
        title="Trusted by Enterprise Leaders"
        subtitle="Strategy directors, intelligence heads, and CEOs rely on InsightAxis for competitive advantage."
        center
      />
      <motion.div
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {TESTIMONIALS.map((t) => (
          <motion.div key={t.initials} variants={fadeUp}>
            <PltCard className="h-full flex flex-col !bg-white/[0.03] backdrop-blur-xl">
              <div className="flex gap-1 mb-4" aria-label="5 star rating">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <blockquote className="font-display text-base md:text-lg italic text-slate-200 leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="mt-6 flex items-center gap-3 pt-4 border-t border-white/10">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 font-mono text-xs font-bold text-white">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">{t.role}</p>
                  <p className="text-xs text-slate-500">{t.company}</p>
                </div>
              </div>
            </PltCard>
          </motion.div>
        ))}
      </motion.div>
    </PltSection>
  );
}
