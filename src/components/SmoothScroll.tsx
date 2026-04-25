"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.05,
      // Apple-like motion: start quick, settle slowly.
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.5,
    });

    // Bridge Lenis → ScrollTrigger so pinning / scrub stay perfectly in sync.
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Lenis caches scroll bounds at init. Lazy-loaded artifact images +
    // late-mounting 3D scenes grow the document AFTER that snapshot, and
    // the user can't scroll past the stale max. Watch body height and
    // tell Lenis + ScrollTrigger to recompute whenever it grows.
    let lastHeight = document.documentElement.scrollHeight;
    let pendingFrame = 0;
    const recompute = () => {
      const h = document.documentElement.scrollHeight;
      if (h === lastHeight) return;
      lastHeight = h;
      lenis.resize();
      ScrollTrigger.refresh();
    };
    const ro = new ResizeObserver(() => {
      // Coalesce bursts of mutation into one rAF — image loads can fire
      // dozens of resize events in a single tick.
      cancelAnimationFrame(pendingFrame);
      pendingFrame = requestAnimationFrame(recompute);
    });
    ro.observe(document.body);

    return () => {
      cancelAnimationFrame(pendingFrame);
      ro.disconnect();
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return null;
}
