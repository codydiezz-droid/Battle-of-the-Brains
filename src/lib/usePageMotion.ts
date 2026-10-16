import { useEffect, type RefObject } from "react";

/**
 * Page-level motion. Everything is skipped for visitors who prefer reduced
 * motion, and for static snapshots built with VITE_STATIC_REVEAL=1.
 * - elements with data-reveal fade up once when they enter the viewport
 * - --scroll (0 to 1 across the first screen) drives the hero parallax
 * - --line-<name> (0 to 1) draws each timeline line as it scrolls into view
 * - elements with data-parallax drift slightly as they pass through the viewport
 * - the header turns solid once the hero is behind it
 */
export function usePageMotion(root: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const still =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches || import.meta.env.VITE_STATIC_REVEAL === "1";

    const reveals = el.querySelectorAll<HTMLElement>("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    if (still) {
      reveals.forEach((r) => r.classList.add("is-in"));
    } else {
      el.classList.add("has-motion");
      reveals.forEach((r) => io.observe(r));
    }

    const lines = [...el.querySelectorAll<HTMLElement>("[data-line]")];
    const drifts = [...el.querySelectorAll<HTMLElement>("[data-parallax]")];
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const vh = window.innerHeight;
        el.style.setProperty("--scroll", String(Math.min(1, window.scrollY / vh)));
        el.classList.toggle("is-scrolled", window.scrollY > vh * 0.7);
        for (const line of lines) {
          const r = line.getBoundingClientRect();
          const p = (vh * 0.75 - r.top) / r.height;
          line.style.setProperty("--line", still ? "1" : String(Math.min(1, Math.max(0, p))));
        }
        if (!still) {
          for (const d of drifts) {
            const r = d.getBoundingClientRect();
            // -1 when the element enters at the bottom, 1 when it leaves at the top.
            const p = (vh / 2 - (r.top + r.height / 2)) / (vh / 2 + r.height / 2);
            d.style.setProperty("--drift", String(Math.min(1, Math.max(-1, p))));
          }
        }
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [root]);
}
