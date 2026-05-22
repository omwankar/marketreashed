import { TRUST_SEGMENTS } from "../../lib/platformData.js";
import { PltSection } from "./shared.jsx";

export function TrustedBy() {
  const loop = TRUST_SEGMENTS.flatMap((s) => s.logos.map((name) => ({ name, segment: s.label })));
  const doubled = [...loop, ...loop];

  return (
    <div className="border-y border-white/[0.06] bg-[#0a0f1e]/60 py-14">
      <p className="text-center text-sm text-slate-400 mb-10 px-4 max-w-2xl mx-auto">
        Trusted by strategy teams, market intelligence leaders, and enterprise decision-makers.
      </p>
      <div className="group overflow-hidden">
        <div className="flex w-max gap-10 animate-plt-marquee group-hover:[animation-play-state:paused] px-4">
          {doubled.map((item, i) => (
            <div key={`${item.name}-${i}`} className="flex flex-col items-center gap-2 shrink-0">
              <div className="flex h-11 min-w-[130px] items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] px-5 font-display text-xs font-bold tracking-[0.2em] text-slate-600 transition-all duration-300 hover:border-blue-500/30 hover:text-slate-200 hover:bg-white/[0.04]">
                {item.name}
              </div>
              <span className="text-[9px] uppercase tracking-wider text-slate-600">{item.segment}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
