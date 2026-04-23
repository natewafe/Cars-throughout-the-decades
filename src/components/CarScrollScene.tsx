"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { DoorRig, MaterialOverride, SceneConfig } from "@/lib/scenes";

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
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

type ProgressRef = { current: number };

/** Outer DOM wrapper: sticky container, captions, finale, scroll listener. */
export function CarScrollScene({ modelUrl, scene, nextHref, nextLabel }: Props) {
  const hostRef = useRef<HTMLElement | null>(null);
  const captionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const finaleRef = useRef<HTMLDivElement | null>(null);
  const hintRef = useRef<HTMLSpanElement | null>(null);
  const progressRef = useRef(0);
  const smoothProgressRef = useRef(0);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    let raf = 0;

    const readProgress = () => {
      const scrollable = el.offsetHeight - window.innerHeight;
      const rectTop = el.getBoundingClientRect().top + window.scrollY;
      const scrolled = window.scrollY - rectTop;
      return clamp01(scrolled / (scrollable || 1));
    };

    const onScroll = () => {
      progressRef.current = readProgress();
    };

    const tick = () => {
      // Smooth the progress value so Lenis rubber-band doesn't flicker overlays.
      smoothProgressRef.current +=
        (progressRef.current - smoothProgressRef.current) * 0.12;
      const p = smoothProgressRef.current;

      scene.captions.forEach((cap, i) => {
        const node = captionRefs.current[i];
        if (!node) return;
        if (p >= cap.from && p <= cap.to) node.classList.add("is-live");
        else node.classList.remove("is-live");
      });
      if (finaleRef.current) {
        if (p >= 0.92) finaleRef.current.classList.add("is-live");
        else finaleRef.current.classList.remove("is-live");
      }
      if (hintRef.current) hintRef.current.style.opacity = p > 0.02 ? "0" : "1";

      raf = requestAnimationFrame(tick);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [scene]);

  captionRefs.current = [];

  return (
    <section ref={hostRef} className="scroll-scene">
      <div className="scene-sticky">
        <div className="scene-canvas">
          <Canvas
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true }}
            camera={{ fov: 32, near: 0.1, far: 500 }}
          >
            <Suspense fallback={null}>
              <SceneContents
                modelUrl={modelUrl}
                keyframes={scene.keyframes}
                materialOverrides={scene.materialOverrides}
                doorRig={scene.doorRig}
                progressRef={smoothProgressRef}
              />
            </Suspense>
          </Canvas>
        </div>

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

        <span ref={hintRef} className="scene-hint">
          Scroll to explore
        </span>
      </div>
    </section>
  );
}

/** Everything inside the R3F canvas: model + camera + shadows + env. */
function SceneContents({
  modelUrl,
  keyframes,
  materialOverrides,
  doorRig,
  progressRef,
}: {
  modelUrl: string;
  keyframes: SceneConfig["keyframes"];
  materialOverrides?: MaterialOverride[];
  doorRig?: DoorRig;
  progressRef: ProgressRef;
}) {
  const { scene: gltfScene } = useGLTF(modelUrl) as unknown as {
    scene: THREE.Group;
  };

  // Clone on mount so multiple visits don't stack mutations.
  const model = useMemo(() => {
    const cloned = gltfScene.clone(true);
    // Clone materials to avoid cross-route mutation
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        mesh.material = Array.isArray(mesh.material)
          ? mesh.material.map((m) => m.clone())
          : mesh.material.clone();
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    return cloned;
  }, [gltfScene]);

  // Compute bbox, normalize: center at origin and set a predictable scale.
  const { modelScale, centerOffset, baseRadius } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const longest = Math.max(size.x, size.y, size.z);
    const targetSize = 4; // world units
    const s = targetSize / longest;
    return {
      modelScale: s,
      centerOffset: center.clone().multiplyScalar(-s),
      // Radius used for camera distance: encompasses sphere of the bounded model.
      baseRadius: (targetSize * Math.sqrt(3)) / 2,
    };
  }, [model]);

  // Apply material overrides (by material name OR mesh node name for robustness).
  useMemo(() => {
    if (!materialOverrides?.length) return;
    let hits = 0;
    const sampled: string[] = [];
    model.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((mat) => {
        if (!mat) return;
        const std = mat as THREE.MeshStandardMaterial;
        const matName = (std.name || "").toLowerCase();
        const nodeName = (mesh.name || "").toLowerCase();
        sampled.push(std.name || mesh.name);
        materialOverrides.forEach((ov) => {
          const re = new RegExp(ov.match, "i");
          if (re.test(matName) || re.test(nodeName)) {
            if (std.color) std.color.setRGB(ov.color[0], ov.color[1], ov.color[2]);
            if (typeof ov.metallic === "number") std.metalness = ov.metallic;
            if (typeof ov.roughness === "number") std.roughness = ov.roughness;
            std.needsUpdate = true;
            hits++;
          }
        });
      });
    });
    if (hits === 0) {
      console.info(
        `[CarScrollScene] no material override matched for ${modelUrl}. Samples:`,
        Array.from(new Set(sampled)).slice(0, 25)
      );
    }
  }, [model, materialOverrides, modelUrl]);

  // Rig door pivot (Countach / Veyron). Wrap matching nodes under a Group at
  // the hinge edge of their collective bbox, so we can rotate the group.
  const doorPivotRef = useRef<THREE.Group | null>(null);

  const doorPivot = useMemo(() => {
    if (!doorRig) return null;
    const re = new RegExp(doorRig.match, "i");
    const matches: THREE.Object3D[] = [];
    model.traverse((obj) => {
      if (re.test(obj.name) && (obj as THREE.Mesh).isMesh) matches.push(obj);
    });
    if (matches.length === 0) {
      console.info(
        `[CarScrollScene] no door nodes matched /${doorRig.match}/ in ${modelUrl}`
      );
      return null;
    }
    // Bounding box of all matches in model-local space
    const bbox = new THREE.Box3();
    matches.forEach((m) => bbox.expandByObject(m));
    const hingeVec = new THREE.Vector3();
    switch (doorRig.hingeOn) {
      case "xmin": hingeVec.set(bbox.min.x, (bbox.min.y + bbox.max.y) / 2, (bbox.min.z + bbox.max.z) / 2); break;
      case "xmax": hingeVec.set(bbox.max.x, (bbox.min.y + bbox.max.y) / 2, (bbox.min.z + bbox.max.z) / 2); break;
      case "ymin": hingeVec.set((bbox.min.x + bbox.max.x) / 2, bbox.min.y, (bbox.min.z + bbox.max.z) / 2); break;
      case "ymax": hingeVec.set((bbox.min.x + bbox.max.x) / 2, bbox.max.y, (bbox.min.z + bbox.max.z) / 2); break;
      case "zmin": hingeVec.set((bbox.min.x + bbox.max.x) / 2, (bbox.min.y + bbox.max.y) / 2, bbox.min.z); break;
      case "zmax": hingeVec.set((bbox.min.x + bbox.max.x) / 2, (bbox.min.y + bbox.max.y) / 2, bbox.max.z); break;
    }
    // Create the pivot at hinge position, and an inner group that offsets
    // the door meshes so their geometry sits at the correct relative position.
    const pivot = new THREE.Group();
    pivot.name = "__door_pivot__";
    pivot.position.copy(hingeVec);
    const inner = new THREE.Group();
    inner.position.copy(hingeVec.clone().negate());
    pivot.add(inner);

    // Re-parent each match into `inner` while preserving its world transform.
    matches.forEach((m) => {
      const worldMat = new THREE.Matrix4();
      m.updateWorldMatrix(true, false);
      worldMat.copy(m.matrixWorld);
      // Remove from current parent and attach to inner; Object3D.attach
      // preserves world transform automatically.
      inner.attach(m);
      // but attach is relative to inner's world, which is pivot's world,
      // which is model-local (pivot is a child of model below).
      void worldMat;
    });

    // pivot's parent will be the model root, so pivot.position is in
    // model-local coordinates. Good.
    model.add(pivot);
    return pivot;
  }, [model, doorRig, modelUrl]);

  useEffect(() => {
    doorPivotRef.current = doorPivot;
  }, [doorPivot]);

  // Per-frame: animate door and camera
  useFrame(() => {
    if (doorRig && doorPivotRef.current) {
      const p = progressRef.current;
      const t = clamp01(
        (p - doorRig.startProgress) / (1 - doorRig.startProgress)
      );
      const angle = t * doorRig.maxRadians;
      if (doorRig.axis === "x") doorPivotRef.current.rotation.x = -angle;
      else if (doorRig.axis === "y") doorPivotRef.current.rotation.y = -angle;
      else doorPivotRef.current.rotation.z = -angle;
    }
  });

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight
        castShadow
        position={[4, 8, 4]}
        intensity={1.1}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={20}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <Environment preset="city" />
      <ContactShadows
        position={[0, -2, 0]}
        opacity={0.55}
        scale={14}
        blur={2.4}
        far={4}
      />
      <group scale={modelScale} position={centerOffset.toArray()}>
        <primitive object={model} />
      </group>
      <CameraController
        keyframes={keyframes}
        progressRef={progressRef}
        baseRadius={baseRadius}
      />
    </>
  );
}

function CameraController({
  keyframes,
  progressRef,
  baseRadius,
}: {
  keyframes: SceneConfig["keyframes"];
  progressRef: ProgressRef;
  baseRadius: number;
}) {
  const { camera } = useThree();
  const kfs = useMemo(
    () => keyframes.map((k) => ({ p: k[0], orbit: parseOrbit(k[1]) })),
    [keyframes]
  );
  const current = useRef<Orbit>({ ...kfs[0].orbit });
  const target = useRef<Orbit>({ ...kfs[0].orbit });

  const sample = (p: number): Orbit => {
    for (let i = 0; i < kfs.length - 1; i++) {
      const a = kfs[i];
      const b = kfs[i + 1];
      if (p >= a.p && p <= b.p) {
        const t = easeInOut((p - a.p) / (b.p - a.p || 1));
        return {
          theta: lerp(a.orbit.theta, b.orbit.theta, t),
          phi: lerp(a.orbit.phi, b.orbit.phi, t),
          radius: lerp(a.orbit.radius, b.orbit.radius, t),
        };
      }
    }
    return p <= kfs[0].p
      ? { ...kfs[0].orbit }
      : { ...kfs[kfs.length - 1].orbit };
  };

  useFrame(() => {
    const p = progressRef.current;
    target.current = sample(p);
    const k = 0.15;
    current.current.theta += (target.current.theta - current.current.theta) * k;
    current.current.phi += (target.current.phi - current.current.phi) * k;
    current.current.radius += (target.current.radius - current.current.radius) * k;

    const theta = (current.current.theta * Math.PI) / 180;
    const phi = (current.current.phi * Math.PI) / 180;
    const r = baseRadius * (current.current.radius / 100) * 2.4;

    camera.position.set(
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.cos(theta)
    );
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  });

  return null;
}

// Preload all four models so navigating between exhibits doesn't re-suspend.
useGLTF.preload("/models/countach.glb");
useGLTF.preload("/models/959.glb");
useGLTF.preload("/models/f1.glb");
useGLTF.preload("/models/veyron.glb");
