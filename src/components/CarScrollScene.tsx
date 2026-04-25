"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  PerformanceMonitor,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { DoorRig, MaterialOverride, SceneConfig } from "@/lib/scenes";
import { disposeClonedScene } from "@/lib/disposeScene";
import { useQualityProfile, type QualityProfile } from "@/lib/deviceTier";
import { upgradeMaterial } from "@/lib/materialUpgrade";
import { SceneLighting } from "@/components/3d/SceneLighting";
import { SceneEnvironment } from "@/components/3d/SceneEnvironment";
import { ScenePostFX } from "@/components/3d/ScenePostFX";
import { getCameraPreset, type CameraPreset } from "@/lib/cameraPresets";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Props = {
  modelUrl: string;
  scene: SceneConfig;
  nextHref?: string;
  nextLabel?: string;
};

type ProgressRef = { current: number };

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};
const smoothstepRange = (min: number, max: number, val: number) =>
  smoothstep((val - min) / (max - min || 1));

/** Full-bleed sticky 3D canvas with floating text cards layered on top.
 *  Architecture:
 *    .scroll-scene (relative, height = N+1 viewports)
 *      ├── .scene-canvas-sticky (position:sticky, full-bleed canvas)
 *      └── .scene-text-overlay (relative z-10, pointer-events:none)
 *           └── one .text-section per caption + finale
 *
 *  ScrollTrigger reads progress from the section's own scroll position;
 *  no GSAP pin/spacer (which previously fought lazy-image height growth).
 */
export function CarScrollScene({ modelUrl, scene, nextHref, nextLabel }: Props) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const finaleRef = useRef<HTMLDivElement | null>(null);
  const hintRef = useRef<HTMLSpanElement | null>(null);
  const quality = useQualityProfile();
  const [dprCap, setDprCap] = useState<number | null>(null);

  const progressRef = useRef(0);

  useEffect(() => {
    useGLTF.preload(modelUrl);
    return () => {
      useGLTF.clear(modelUrl);
    };
  }, [modelUrl]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.6,
        onUpdate: (self) => {
          const p = self.progress;
          progressRef.current = p;

          // Per-card reveal — each caption owns a slice of progress equal to
          // its block. Use cap.from / cap.to from the scene config.
          scene.captions.forEach((cap, i) => {
            const node = cardRefs.current[i];
            if (!node) return;
            node.classList.toggle("is-live", p >= cap.from && p <= cap.to);
          });
          if (finaleRef.current) {
            finaleRef.current.classList.toggle("is-live", p >= 0.92);
          }
          if (hintRef.current) {
            hintRef.current.style.opacity = p > 0.02 ? "0" : "1";
          }
        },
      });
    }, section);

    return () => ctx.revert();
  }, [scene]);

  cardRefs.current = [];

  const themeSlug = modelUrl.includes("veyron")
    ? "veyron"
    : modelUrl.includes("959")
    ? "959"
    : modelUrl.includes("f1")
    ? "f1"
    : "countach";

  const preset = getCameraPreset(themeSlug);

  return (
    <section ref={sectionRef} className="scroll-scene" data-car={themeSlug}>
      {/* FULL-BLEED STICKY CANVAS */}
      <div className="scene-canvas-sticky">
        <Canvas
          dpr={[quality.dpr[0], Math.min(quality.dpr[1], dprCap ?? quality.dpr[1])]}
          shadows={quality.shadowMapSize > 0 ? { type: THREE.PCFSoftShadowMap } : false}
          gl={{
            antialias: quality.tier !== "low",
            alpha: true,
            powerPreference: "high-performance",
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.75,
          }}
          camera={{ fov: 32, near: 0.1, far: 500, position: preset.initialCamera }}
        >
          <PerformanceMonitor
            bounds={() => [45, 60]}
            onIncline={() => setDprCap((c) => (c && c < quality.dpr[1] ? c + 0.25 : null))}
            onDecline={() => setDprCap((c) => Math.max(1, (c ?? quality.dpr[1]) - 0.25))}
          />
          <Suspense fallback={null}>
            <SceneContents
              modelUrl={modelUrl}
              materialOverrides={scene.materialOverrides}
              doorRig={scene.doorRig}
              progressRef={progressRef}
              preset={preset}
              quality={quality}
            />
            {quality.enablePost && <ScenePostFX />}
          </Suspense>
        </Canvas>
        <span ref={hintRef} className="scene-hint">
          Scroll to explore
        </span>
      </div>

      {/* TEXT OVERLAY — floating cards layered above the canvas. */}
      <div className="scene-text-overlay">
        {/* First viewport is empty — car is centered & auto-rotating. */}
        <section className="text-section text-section-spacer" aria-hidden />

        {scene.captions.map((cap, i) => (
          <section key={i} className="text-section">
            <div
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="text-card"
            >
              <span className="caption-eyebrow">{cap.eyebrow}</span>
              <span className="caption-line">{cap.line}</span>
            </div>
          </section>
        ))}

        {nextHref && (
          <section className="text-section">
            <div ref={finaleRef} className="text-card text-card-finale">
              <span className="finale-eyebrow">Next Exhibit</span>
              <span className="finale-title">{scene.finaleTitle}</span>
              <a className="finale-cta" href={nextHref}>
                Enter {nextLabel} →
              </a>
            </div>
          </section>
        )}
      </div>
    </section>
  );
}

/** Inside the canvas: model + lighting + env + shadows + preset camera. */
function SceneContents({
  modelUrl,
  materialOverrides,
  doorRig,
  progressRef,
  preset,
  quality,
}: {
  modelUrl: string;
  materialOverrides?: MaterialOverride[];
  doorRig?: DoorRig;
  progressRef: ProgressRef;
  preset: CameraPreset;
  quality: QualityProfile;
}) {
  const { scene: gltfScene } = useGLTF(modelUrl) as unknown as {
    scene: THREE.Group;
  };

  // Clone + upgrade materials once per mount.
  const model = useMemo(() => {
    const cloned = gltfScene.clone(true);
    cloned.traverse((obj) => {
      upgradeMaterial(obj as THREE.Mesh, {
        usePhysicalPaint: quality.usePhysicalPaint,
        anisotropy: quality.anisotropy,
      });
    });
    return cloned;
  }, [gltfScene, quality.usePhysicalPaint, quality.anisotropy]);

  // Center model on its bbox; ground tires at y = -0.5 (matches preset camera Y).
  const { modelScale, centerOffset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const longest = Math.max(size.x, size.y, size.z);
    const targetSize = 4;
    const s = targetSize / longest;
    const GROUND_Y = -0.5;
    const offs = new THREE.Vector3(
      -center.x * s,
      GROUND_Y - box.min.y * s,
      -center.z * s
    );
    return { modelScale: s, centerOffset: offs };
  }, [model]);

  // Material overrides
  useMemo(() => {
    if (!materialOverrides?.length) return;
    model.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((mat) => {
        if (!mat) return;
        const std = mat as THREE.MeshStandardMaterial;
        const matName = (std.name || "").toLowerCase();
        const nodeName = (mesh.name || "").toLowerCase();
        materialOverrides.forEach((ov) => {
          const re = new RegExp(ov.match, "i");
          if (re.test(matName) || re.test(nodeName)) {
            std.color?.setRGB(ov.color[0], ov.color[1], ov.color[2]);
            if (typeof ov.metallic === "number") std.metalness = ov.metallic;
            if (typeof ov.roughness === "number") std.roughness = ov.roughness;
            std.needsUpdate = true;
          }
        });
      });
    });
  }, [model, materialOverrides]);

  // Door rigging
  const doorPivotRef = useRef<THREE.Group | null>(null);

  const doorPivot = useMemo(() => {
    if (!doorRig) return null;
    const re = new RegExp(doorRig.match, "i");
    const matches: THREE.Object3D[] = [];
    model.traverse((obj) => {
      if (re.test(obj.name) && (obj as THREE.Mesh).isMesh) matches.push(obj);
    });
    if (matches.length === 0) return null;

    const bbox = new THREE.Box3();
    matches.forEach((m) => bbox.expandByObject(m));
    const h = new THREE.Vector3();
    switch (doorRig.hingeOn) {
      case "xmin": h.set(bbox.min.x, (bbox.min.y + bbox.max.y) / 2, (bbox.min.z + bbox.max.z) / 2); break;
      case "xmax": h.set(bbox.max.x, (bbox.min.y + bbox.max.y) / 2, (bbox.min.z + bbox.max.z) / 2); break;
      case "ymin": h.set((bbox.min.x + bbox.max.x) / 2, bbox.min.y, (bbox.min.z + bbox.max.z) / 2); break;
      case "ymax": h.set((bbox.min.x + bbox.max.x) / 2, bbox.max.y, (bbox.min.z + bbox.max.z) / 2); break;
      case "zmin": h.set((bbox.min.x + bbox.max.x) / 2, (bbox.min.y + bbox.max.y) / 2, bbox.min.z); break;
      case "zmax": h.set((bbox.min.x + bbox.max.x) / 2, (bbox.min.y + bbox.max.y) / 2, bbox.max.z); break;
    }
    const pivot = new THREE.Group();
    pivot.name = "__door_pivot__";
    pivot.position.copy(h);
    const inner = new THREE.Group();
    inner.position.copy(h.clone().negate());
    pivot.add(inner);
    matches.forEach((m) => inner.attach(m));
    model.add(pivot);
    return pivot;
  }, [model, doorRig]);

  useEffect(() => {
    doorPivotRef.current = doorPivot;
  }, [doorPivot]);

  useEffect(() => {
    return () => {
      disposeClonedScene(model);
    };
  }, [model]);

  // Door open: drives off scroll progress like before.
  useFrame(() => {
    if (doorRig && doorPivotRef.current) {
      const p = progressRef.current;
      const t = clamp01((p - doorRig.startProgress) / (1 - doorRig.startProgress));
      const eased = smoothstep(t);
      const angle = eased * doorRig.maxRadians;
      const pivot = doorPivotRef.current;
      pivot.rotation.x = doorRig.axis === "x" ? -angle : 0;
      pivot.rotation.y = doorRig.axis === "y" ? -angle : 0;
      pivot.rotation.z = doorRig.axis === "z" ? -angle : 0;
    }
  });

  // The model group has its own ref so the camera controller can lerp
  // its X position without blowing away the bbox-derived offset.
  const modelGroupRef = useRef<THREE.Group | null>(null);

  return (
    <>
      <SceneLighting shadowMapSize={quality.shadowMapSize} />
      {quality.enableEnv && <SceneEnvironment />}

      <ContactShadows
        position={[0, -0.499, 0]}
        opacity={0.6}
        scale={15}
        blur={2.5}
        far={4}
        resolution={quality.contactShadowResolution}
      />

      <group ref={modelGroupRef} position={[preset.modelOffset[0], preset.modelOffset[1], preset.modelOffset[2]]}>
        <group scale={modelScale} position={centerOffset.toArray()}>
          <primitive object={model} />
        </group>
      </group>

      <PresetCameraController
        progressRef={progressRef}
        preset={preset}
        modelGroupRef={modelGroupRef}
      />
    </>
  );
}

/** Two-point camera lerp + auto-rotate handoff + scroll-locked rotation
 *  + lateral model slide. The single source of motion truth — replaces
 *  the old 5-keyframe spherical-orbit controller. */
function PresetCameraController({
  progressRef,
  preset,
  modelGroupRef,
}: {
  progressRef: ProgressRef;
  preset: CameraPreset;
  modelGroupRef: React.RefObject<THREE.Group | null>;
}) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const p = progressRef.current;
    const group = modelGroupRef.current;
    if (!group) return;

    // 1. CAMERA position — interpolate initial → final over 0.1 → 0.9.
    const t = smoothstepRange(0.1, 0.9, p);
    const tx = lerp(preset.initialCamera[0], preset.finalCamera[0], t);
    const ty = lerp(preset.initialCamera[1], preset.finalCamera[1], t);
    const tz = lerp(preset.initialCamera[2], preset.finalCamera[2], t);
    // Per-frame ease for buttery motion (~5% catch-up per 16ms frame).
    const k = 1 - Math.pow(0.005, delta);
    camera.position.x += (tx - camera.position.x) * k;
    camera.position.y += (ty - camera.position.y) * k;
    camera.position.z += (tz - camera.position.z) * k;

    // 2. MODEL slide — from 0 → ±2.5 over the first 15% of scroll.
    const slideT = smoothstepRange(0, 0.15, p);
    const targetX =
      preset.modelOffset[0] + slideT * 2.5 * preset.slideDirection;
    group.position.x += (targetX - group.position.x) * k;

    // 3. MODEL rotation — auto-rotate while idle (<5%), then scroll-lock.
    if (p < 0.05) {
      group.rotation.y += delta * 0.3;
    } else {
      const targetRot = preset.rotationStart + p * Math.PI * 1.5;
      group.rotation.y += (targetRot - group.rotation.y) * (1 - Math.pow(0.01, delta));
    }

    // 4. Look at the model's current world position so it stays framed.
    target.current.set(group.position.x, group.position.y + 0.5, group.position.z);
    camera.lookAt(target.current);
    camera.updateProjectionMatrix();
  });

  return null;
}
