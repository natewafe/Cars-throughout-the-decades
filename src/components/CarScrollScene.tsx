"use client";

import { useEffect, useRef } from "react";
import type { SceneConfig } from "@/lib/scenes";

type Props = {
  modelUrl: string;
  scene: SceneConfig;
  nextHref?: string;
  nextLabel?: string;
};

type Orbit = { theta: number; phi: number; radius: number };

const ORBIT_RE = /(-?\d+(?:\.\d+)?)deg\s+(-?\d+(?:\.\d+)?)deg\s+(-?\d+(?:\.\d+)?)%/;

function parseOrbit(str: string): Orbit {
  const m = ORBIT_RE.exec(str.trim());
  if (!m) return { theta: 0, phi: 80, radius: 120 };
  return { theta: +m[1], phi: +m[2], radius: +m[3] };
}
function formatOrbit(o: Orbit): string {
  return `${o.theta.toFixed(2)}deg ${o.phi.toFixed(2)}deg ${o.radius.toFixed(2)}%`;
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function CarScrollScene({ modelUrl, scene, nextHref, nextLabel }: Props) {
  const hostRef = useRef<HTMLElement | null>(null);
  const mvRef = useRef<HTMLElement | null>(null);
  const loadRef = useRef<HTMLSpanElement | null>(null);
  const hintRef = useRef<HTMLSpanElement | null>(null);
  const captionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const finaleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = hostRef.current;
    const mv = mvRef.current;
    if (!el || !mv) return;

    const keyframes = scene.keyframes.map((k) => ({
      p: k[0],
      orbit: parseOrbit(k[1]),
    }));

    let current: Orbit = { ...keyframes[0].orbit };
    let target: Orbit = { ...keyframes[0].orbit };
    let raf = 0;
    let mounted = true;

    const sample = (p: number): Orbit => {
      for (let i = 0; i < keyframes.length - 1; i++) {
        const a = keyframes[i];
        const b = keyframes[i + 1];
        if (p >= a.p && p <= b.p) {
          const t = easeInOut((p - a.p) / (b.p - a.p || 1));
          return {
            theta: lerp(a.orbit.theta, b.orbit.theta, t),
            phi: lerp(a.orbit.phi, b.orbit.phi, t),
            radius: lerp(a.orbit.radius, b.orbit.radius, t),
          };
        }
      }
      return p <= keyframes[0].p
        ? { ...keyframes[0].orbit }
        : { ...keyframes[keyframes.length - 1].orbit };
    };

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      const progress = clamp01(scrolled / (scrollable || 1));

      target = sample(progress);

      scene.captions.forEach((cap, i) => {
        const node = captionRefs.current[i];
        if (!node) return;
        if (progress >= cap.from && progress <= cap.to) node.classList.add("is-live");
        else node.classList.remove("is-live");
      });

      if (finaleRef.current) {
        if (progress >= 0.9) finaleRef.current.classList.add("is-live");
        else finaleRef.current.classList.remove("is-live");
      }
      if (hintRef.current) hintRef.current.style.opacity = progress > 0.02 ? "0" : "1";
    };

    const tick = () => {
      if (!mounted) return;
      const k = 0.18;
      current.theta += (target.theta - current.theta) * k;
      current.phi += (target.phi - current.phi) * k;
      current.radius += (target.radius - current.radius) * k;
      // setAttribute accepted directly on the custom element
      (mv as unknown as Element).setAttribute("camera-orbit", formatOrbit(current));
      raf = requestAnimationFrame(tick);
    };

    const onLoad = () => {
      if (loadRef.current) loadRef.current.classList.add("is-done");
      (mv as unknown as Element).setAttribute("camera-orbit", formatOrbit(current));
      onScroll();
      cancelAnimationFrame(raf);
      tick();
    };

    const onError = () => {
      if (loadRef.current) {
        loadRef.current.classList.add("is-error");
        loadRef.current.textContent =
          "Model failed to load. Check browser console for details.";
      }
    };

    mv.addEventListener("load", onLoad as EventListener, { once: true });
    mv.addEventListener("error", onError as EventListener);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    tick();

    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      mv.removeEventListener("load", onLoad as EventListener);
      mv.removeEventListener("error", onError as EventListener);
    };
  }, [scene]);

  // Reset captionRefs length on render
  captionRefs.current = [];

  return (
    <section
      ref={hostRef}
      className="scroll-scene"
    >
      <div className="scene-sticky">
        {/* model-viewer is registered by the CDN script in layout.tsx. */}
        <model-viewer
          ref={mvRef as never}
          src={modelUrl}
          alt="Interactive 3D model"
          camera-controls=""
          touch-action="pan-y"
          disable-zoom=""
          interaction-prompt="none"
          shadow-intensity="0.9"
          exposure="0.95"
          environment-image="neutral"
          reveal="auto"
          camera-orbit={scene.keyframes[0][1]}
        />

        {scene.captions.map((cap, i) => (
          <div
            key={i}
            ref={(el) => {
              captionRefs.current[i] = el;
            }}
            className={`scene-caption ${cap.pos}`}
          >
            <span className="caption-eyebrow">{cap.eyebrow}</span>
            <span className="caption-line">{cap.line}</span>
          </div>
        ))}

        {nextHref && (
          <div ref={finaleRef} className="scene-finale">
            <span className="finale-eyebrow">Next Exhibit</span>
            <span className="finale-title">{scene.finaleTitle}</span>
            <a className="finale-cta" href={nextHref}>
              Enter {nextLabel} →
            </a>
          </div>
        )}

        <span ref={loadRef} className="scene-load">
          Loading 3D model
        </span>
        <span ref={hintRef} className="scene-hint">
          Scroll to explore
        </span>
      </div>
    </section>
  );
}
