import { useEffect } from "react";

/**
 * Watches all elements with `.reveal` and toggles `.visible` when they
 * enter the viewport. Respects prefers-reduced-motion.
 */
export function useScrollReveal({ rootMargin = "0px 0px -8% 0px", threshold = 0.12 } = {}) {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const targets = document.querySelectorAll(".reveal");
    if (targets.length === 0) return undefined;

    if (prefersReducedMotion) {
      targets.forEach((el) => el.classList.add("visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin, threshold },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  });
}

/**
 * Returns a ref that can be attached to a single element to reveal it.
 * Useful when JSX is regenerated and elements are dynamic.
 */
export function useRevealRef() {
  return (el) => {
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("visible");
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    obs.observe(el);
  };
}
