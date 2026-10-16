import { useEffect, useRef, useState } from "react";
import type { BridgeSceneHandle } from "./bridgeScene";

// Skip the 3D scene on data-saver connections and low-memory devices; the
// static arc is shown instead.
function canAffordScene() {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  if (nav.connection?.saveData) return false;
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 4) return false;
  return true;
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Decorative background for the hero. A static gradient and arc render first;
 * the three.js scene loads once the browser is idle and fades in on top.
 * Hidden from assistive technology: it carries no information.
 */
export function HeroBridge() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    // Reduced motion: keep the static arc and skip downloading three.js at all.
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canvas || still || !canAffordScene() || !hasWebGL()) return;

    const compact = window.matchMedia("(max-width: 760px)").matches;
    let handle: BridgeSceneHandle | null = null;
    let cancelled = false;
    let visible = true;

    const onPointer = (e: PointerEvent) => {
      handle?.setPointer(e.clientX / window.innerWidth - 0.5, -(e.clientY / window.innerHeight - 0.5));
    };
    const onScroll = () => {
      const h = canvas.clientHeight || 1;
      handle?.setScroll(Math.min(1, Math.max(0, window.scrollY / h)));
    };
    const sync = () => {
      if (!handle) return;
      if (visible && !document.hidden) handle.start();
      else handle.stop();
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });

    // Wait for the browser to be idle so the scene never competes with first paint.
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 300));
    idle(() => {
      import("./bridgeScene").then(({ createBridgeScene }) => {
        if (cancelled) return;
        handle = createBridgeScene(canvas, { still, compact });
        setLive(true);
        io.observe(canvas);
        sync();
      });
    });

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", sync);
    return () => {
      cancelled = true;
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", sync);
      handle?.dispose();
    };
  }, []);

  return (
    <div className={live ? "hero-bg is-live" : "hero-bg"} aria-hidden="true">
      <svg className="hero-arc" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="hero-arc-grad" x1="0" x2="1">
            <stop offset="0" stopColor="#ffb81c" />
            <stop offset="0.5" stopColor="#fff2d4" />
            <stop offset="1" stopColor="#ff7a3d" />
          </linearGradient>
        </defs>
        <path
          d="M380 470 C 580 120, 900 120, 1120 470"
          fill="none"
          stroke="url(#hero-arc-grad)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
      <canvas ref={canvasRef} className="hero-canvas" />
    </div>
  );
}
