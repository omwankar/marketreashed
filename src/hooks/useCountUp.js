import { useEffect, useRef, useState } from "react";

function parseNumericValue(value) {
  if (typeof value === "number") return value;
  const normalized = String(value).replace(/,/g, "");
  const match = normalized.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

/**
 * Animates a number from 0 -> target using easeOutExpo.
 * If `startOnVisible` is true, it waits until the returned ref enters the viewport.
 */
export function useCountUp(value, duration = 2000, startOnVisible = true) {
  const target = parseNumericValue(value);
  const [current, setCurrent] = useState(0);
  const ref = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCurrent(target);
      startedRef.current = true;
      return undefined;
    }

    const run = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      const start = performance.now();
      let frame = 0;
      const tick = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(2, -10 * t);
        setCurrent(target * eased);
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(frame);
    };

    if (!startOnVisible || !ref.current) {
      return run();
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          run();
          obs.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target, duration, startOnVisible]);

  return [current, ref];
}
