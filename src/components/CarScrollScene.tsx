"use client";

import { useEffect, useRef } from "react";
import type { SceneConfig, MaterialOverride } from "@/lib/scenes";

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

    // Target progress is what scroll reports. Smoothed progress is what drives
    // the camera, lerped towards target — this absorbs trackpad rubber-band.
    let targetProgress = 0;
    let smoothProgress = 0;

    // Current orbit is another lerp pass, so even if smoothProgress changes
    // direction briefly the orbit glides.
    let current: Orbit = { ...keyframes[0].orbit };
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

    const readProgress = () => {
      // Use scrollY against absolute offsetTop to avoid jitter from
      // getBoundingClientRect during Lenis smoothing.
      const rectTop =
        el.getBoundingClientRect().top + window.scrollY;
      const scrollable = el.offsetHeight - window.innerHeight;
      const scrolled = window.scrollY - rectTop;
      return clamp01(scrolled / (scrollable || 1));
    };

    const updateOverlays = (progress: number) => {
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

    const onScroll = () => {
      targetProgress = readProgress();
    };

    const tick = () => {
      if (!mounted) return;
      // Stage 1: smooth the progress value itself
      smoothProgress += (targetProgress - smoothProgress) * 0.12;
      // Stage 2: sample keyframes at the smoothed progress
      const goal = sample(smoothProgress);
      // Stage 3: smooth the orbit towards the sampled goal
      const k = 0.2;
      current.theta += (goal.theta - current.theta) * k;
      current.phi += (goal.phi - current.phi) * k;
      current.radius += (goal.radius - current.radius) * k;
      (mv as Element).setAttribute("camera-orbit", formatOrbit(current));
      updateOverlays(smoothProgress);
      raf = requestAnimationFrame(tick);
    };

    const applyMaterialOverrides = () => {
      if (!scene.materialOverrides?.length) return;
      // model-viewer exposes a `model` property after load with `materials` array.
      type MV = HTMLElement & {
        model?: {
          materials: Array<{
            name: string;
            pbrMetallicRoughness: {
              setBaseColorFactor: (c: [number, number, number, number]) => void;
              setMetallicFactor?: (v: number) => void;
              setRoughnessFactor?: (v: number) => void;
            };
          }>;
        };
      };
      const mats = (mv as MV).model?.materials ?? [];
      if (mats.length === 0) return;

      const names = mats.map((m) => m.name);
      let hits = 0;

      scene.materialOverrides.forEach((ov: MaterialOverride) => {
        const re = new RegExp(ov.match, "i");
        mats.forEach((m) => {
          if (re.test(m.name)) {
            m.pbrMetallicRoughness.setBaseColorFactor(ov.color);
            if (typeof ov.metallic === "number") {
              m.pbrMetallicRoughness.setMetallicFactor?.(ov.metallic);
            }
            if (typeof ov.roughness === "number") {
              m.pbrMetallicRoughness.setRoughnessFactor?.(ov.roughness);
            }
            hits++;
          }
        });
      });

      // Dev aid: when patterns miss, log the material list so we can refine.
      if (hits === 0 && scene.materialOverrides.length > 0) {
        console.info(
          `[CarScrollScene] no material override matched for ${modelUrl}. Materials:`,
          names
        );
      }
    };

    const onLoad = () => {
      if (loadRef.current) loadRef.current.classList.add("is-done");
      applyMaterialOverrides();
      onScroll();
      (mv as Element).setAttribute("camera-orbit", formatOrbit(current));
      cancelAnimationFrame(raf);
      tick();
    };

    const onError = () => {
      if (loadRef.current) {
        loadRef.current.classList.add("is-error");
        loadRef.current.textContent = "Model failed to load.";
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
  }, [scene, modelUrl]);

  captionRefs.current = [];

  return (
    <section ref={hostRef} className="scroll-scene">
      <div className="scene-sticky">
        <model-viewer
          ref={mvRef as never}
          src={modelUrl}
          alt="Interactive 3D model"
          interaction-prompt="none"
          shadow-intensity="1.1"
          shadow-softness="0.85"
          exposure="1.05"
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
