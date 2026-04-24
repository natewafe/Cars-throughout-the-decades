"use client";

import { useEffect } from "react";

/** Dev-only: logs JS heap usage every 3s so you can watch for Three.js leaks
 * as you navigate between rooms. No-op in production and in browsers that
 * don't expose performance.memory (non-Chromium). */
export function HeapLogger() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const perf = performance as Performance & {
      memory?: { usedJSHeapSize: number; totalJSHeapSize: number };
    };
    if (!perf.memory) return;

    const id = window.setInterval(() => {
      const used = (perf.memory!.usedJSHeapSize / 1048576).toFixed(1);
      const total = (perf.memory!.totalJSHeapSize / 1048576).toFixed(1);
      const nodes = document.getElementsByTagName("*").length;
      // eslint-disable-next-line no-console
      console.log(`[heap] ${used} / ${total} MB · ${nodes} DOM nodes`);
    }, 3000);
    return () => window.clearInterval(id);
  }, []);

  return null;
}
