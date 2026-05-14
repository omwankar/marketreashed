import { useEffect } from "react";

/**
 * Watches all elements with `.reveal` and toggles `.visible` when they
 * enter the viewport. Respects prefers-reduced-motion.
 *
 * The `key` argument should change whenever the page content changes
 * (e.g. pass `useLocation().pathname` so the observer re-attaches after
 * a client-side route change picks up the new route's `.reveal` nodes).
 */
export function useScrollReveal({ rootMargin = "0px 0px -8% 0px", threshold = 0.12, key } = {}) {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Defer one frame so newly-mounted route children are in the DOM and
    // any layout-shifting parent (sticky navbar, breadcrumb, etc.) has
    // settled before IntersectionObserver computes intersection.
    let observer;
    const raf = requestAnimationFrame(() => {
      const targets = document.querySelectorAll(".reveal:not(.visible)");
      if (targets.length === 0) return;

      if (prefersReducedMotion) {
        targets.forEach((el) => el.classList.add("visible"));
        return;
      }

      observer = new IntersectionObserver(
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
    });

    // Safety net for client-side navigation: if for some reason the
    // observer never marks elements visible (e.g. layout calc is delayed),
    // force-reveal everything after a short delay so content never stays
    // permanently hidden.
    const safetyTimer = setTimeout(() => {
      document
        .querySelectorAll(".reveal:not(.visible)")
        .forEach((el) => el.classList.add("visible"));
    }, 1200);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(safetyTimer);
      if (observer) observer.disconnect();
    };
  }, [key, rootMargin, threshold]);
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
