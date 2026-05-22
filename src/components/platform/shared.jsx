import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

export const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
};

export const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export function PltSection({ id, children, className = "", ariaLabel, dark = false }) {
  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={`relative px-4 py-24 md:px-8 lg:py-32 ${dark ? "bg-[#0a0f1e]/80" : ""} ${className}`}
    >
      <div className="relative z-10 mx-auto max-w-[1280px]">{children}</div>
    </section>
  );
}

export function PltReveal({ children, className = "", delay = 0, as: Tag = motion.div }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduceMotion = useReducedMotion();
  if (reduceMotion) {
    return <div ref={ref} className={className}>{children}</div>;
  }
  return (
    <Tag
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={fadeUp}
      transition={{ delay, duration: 0.45 }}
    >
      {children}
    </Tag>
  );
}

export function PltHeading({ eyebrow, title, subtitle, center = false }) {
  return (
    <PltReveal className={`mb-16 max-w-3xl ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && <p className="plt-eyebrow mb-4">{eyebrow}</p>}
      <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--plt-text,#f5f0e8)] md:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
        {title}
      </h2>
      {subtitle && <p className="mt-5 text-lg leading-relaxed text-[var(--plt-muted,#8a96a8)]">{subtitle}</p>}
      <div className={`plt-divider mt-8 ${center ? "mx-auto max-w-xs" : "max-w-md"}`} />
    </PltReveal>
  );
}

export function PltCard({ children, className = "", interactive = true }) {
  return (
    <motion.div
      className={`plt-card p-6 ${interactive ? "plt-card-interactive" : ""} ${className}`}
      whileHover={interactive ? { scale: 1.01 } : undefined}
    >
      {children}
    </motion.div>
  );
}

export function PltIconBox({ children, className = "" }) {
  return (
    <div
      className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600/90 to-violet-600/80 shadow-lg shadow-blue-900/40 ${className}`}
    >
      {children}
    </div>
  );
}

export function PltBadge({ children, live = false }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium tracking-wide ${
        live
          ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300 plt-ai-pulse"
          : "border-white/10 bg-white/5 text-slate-300"
      }`}
    >
      {live && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />}
      {children}
    </span>
  );
}

export function PltSkeleton({ className = "h-20" }) {
  return (
    <div className={`animate-pulse rounded-xl bg-white/5 ${className}`} aria-hidden />
  );
}
