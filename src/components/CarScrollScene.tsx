"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { DoorRig, MaterialOverride, SceneConfig } from "@/lib/scenes";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Props = {
  modelUrl: string;
  scene: SceneConfig;
  nextHref?: string;
  nextLabel?: string;
};

type Orbit = { theta: number; phi: number; radius: number };
type ProgressRef = { current: number };

const ORBIT_RE = /(-?\d+(?:\.\d+)?)deg\s+(-?\d+(?:\.\d+)?)deg\s+(-?\d+(?:\.\d+)?)%/;

function parseOrbit(str: string): Orbit {
  const m = ORBIT_RE.exec(str.trim());
  if (!m) return { theta: 0, phi: 80, radius: 120 };
  return { theta: +m[1], phi: +m[2], radius: +m[3] };
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
// Cubic inOut — gentler than quad, avoids the "pause" feeling at keyframes.
const smoothstep = (t: number) => t * t * (3 - 2 * t);

/** Top-level DOM wrapper: pinned section, captions, finale, GSAP scroll. */
export function CarScrollScene({ modelUrl, scene, nextHref, nextLabel }: Props) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const pinRef = useRef<HTMLDivElement | null>(null);
  const captionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const finaleRef = useRef<HTMLDivElement | null>(null);
  const hintRef = useRef<HTMLSpanElement | null>(null);

  // Shared scroll progress — written by ScrollTrigger, read by R3F useFrame.
  const progressRef = useRef(0);
  // Horizontal bias for the camera. -1 = caption on right → model shifts left;
  // +1 = caption on left → model shifts right; 0 = centered.
  const sideBiasRef = useRef(0);

  useEffect(() => {
    useGLTF.preload(modelUrl);
    return () => {
      useGLTF.clear(modelUrl);
    };
  }, [modelUrl]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const pin = pinRef.current;
    if (!section || !pin) return;

    // Ensure any prior ScrollTriggers on this section are disposed (route swap).
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "+=280%",
        pin: pin,
        // scrub 0.6 makes the timeline lag scroll by ~0.6s — gives physical weight
        // without feeling sluggish. The ref-driven R3F reads progressRef each frame.
        scrub: 0.6,
        onUpdate: (self) => {
          const p = self.progress;
          progressRef.current = p;

          // DOM overlays — written directly, no React state
          let activeBias = 0;
          scene.captions.forEach((cap, i) => {
            const node = captionRefs.current[i];
            if (!node) return;
            const active = p >= cap.from && p <= cap.to;
            node.classList.toggle("is-live", active);
            if (active) {
              // Left caption → shift model right; right caption → shift left;
              // bottom caption → no horizontal bias, only vertical handled by camera.
              if (cap.pos === "left") activeBias = 1;
              else if (cap.pos === "right") activeBias = -1;
              else activeBias = 0;
            }
          });
          sideBiasRef.current = activeBias;
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

  captionRefs.current = [];

  // Derive a per-car theme slug for the scene background. The Veyron's
  // primary-hero imagery is a bold orange, which clashes with our default
  // warm-cream gradient — switch that car to a cooler, darker stage.
  const themeSlug = modelUrl.includes("veyron")
    ? "veyron"
    : modelUrl.includes("959")
    ? "959"
    : modelUrl.includes("f1")
    ? "f1"
    : "countach";

  return (
    <section ref={sectionRef} className="scroll-scene" data-car={themeSlug}>
      <div ref={pinRef} className="scene-sticky">
        <div className="scene-canvas">
          <Canvas
            dpr={[1.5, 2.5]}
            shadows
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.05,
            }}
            camera={{ fov: 30, near: 0.1, far: 500 }}
          >
            <Suspense fallback={null}>
              <SceneContents
                modelUrl={modelUrl}
                keyframes={scene.keyframes}
                materialOverrides={scene.materialOverrides}
                doorRig={scene.doorRig}
                progressRef={progressRef}
                sideBiasRef={sideBiasRef}
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

/** Everything inside the R3F canvas: model + camera + lighting + floor. */
function SceneContents({
  modelUrl,
  keyframes,
  materialOverrides,
  doorRig,
  progressRef,
  sideBiasRef,
}: {
  modelUrl: string;
  keyframes: SceneConfig["keyframes"];
  materialOverrides?: MaterialOverride[];
  doorRig?: DoorRig;
  progressRef: ProgressRef;
  sideBiasRef: ProgressRef;
}) {
  const { scene: gltfScene } = useGLTF(modelUrl) as unknown as {
    scene: THREE.Group;
  };

  // Clone + upgrade materials once per mount.
  const model = useMemo(() => {
    const cloned = gltfScene.clone(true);
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const upgrade = (mat: THREE.Material): THREE.Material => {
        const std = (mat as THREE.MeshStandardMaterial).clone();
        std.envMapIntensity = 1.6;
        // Heuristic: paint/body/lack → upgrade to MeshPhysical with clearcoat
        const name = (std.name || mesh.name || "").toLowerCase();
        if (/paint|body|lack|carrosserie|karosserie|exterior|shell/.test(name)) {
          const phys = new THREE.MeshPhysicalMaterial();
          phys.copy(std as unknown as THREE.MeshPhysicalMaterial);
          phys.clearcoat = 1.0;
          phys.clearcoatRoughness = 0.08;
          phys.metalness = Math.max(std.metalness ?? 0.6, 0.75);
          phys.roughness = Math.min(std.roughness ?? 0.35, 0.32);
          phys.envMapIntensity = 1.8;
          return phys;
        }
        // Glass-ish: make it slightly reflective
        if (/glass|window|windshield|vetro/.test(name)) {
          std.transparent = true;
          std.opacity = Math.min(std.opacity, 0.65);
          std.roughness = 0.05;
          std.metalness = 0.0;
        }
        // Chrome / metal trim
        if (/chrome|metal.*trim|trim.*metal/.test(name)) {
          std.metalness = 1.0;
          std.roughness = 0.12;
        }
        return std;
      };
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map(upgrade)
        : upgrade(mesh.material);
    });
    return cloned;
  }, [gltfScene]);

  const { modelScale, centerOffset, baseRadius } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const longest = Math.max(size.x, size.y, size.z);
    const targetSize = 4;
    const s = targetSize / longest;
    // Ground plane in this scene sits at y = -2 (see ContactShadows position
    // below). Translate Y so bbox.min.y after scaling == -2, i.e. car's tyres
    // are on the ground instead of centered around the origin.
    const GROUND_Y = -2;
    const offs = new THREE.Vector3(
      -center.x * s,
      GROUND_Y - box.min.y * s,
      -center.z * s
    );
    return {
      modelScale: s,
      centerOffset: offs,
      baseRadius: (targetSize * Math.sqrt(3)) / 2,
    };
  }, [model]);

  // Material overrides
  useMemo(() => {
    if (!materialOverrides?.length) return;
    let hits = 0;
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
            hits++;
          }
        });
      });
    });
    void hits;
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

  return (
    <>
      {/* Key / fill / rim lighting for a showroom feel */}
      <ambientLight intensity={0.35} />
      <directionalLight
        castShadow
        position={[6, 10, 6]}
        intensity={2.4}
        color={"#ffffff"}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={25}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0001}
      />
      <directionalLight
        position={[-6, 4, -4]}
        intensity={0.8}
        color={"#dde6ff"}
      />
      <directionalLight
        position={[0, 6, -8]}
        intensity={1.2}
        color={"#ffe8cc"}
      />

      {/* Studio HDRI supplies real reflections on paint + glass */}
      <Environment preset="warehouse" environmentIntensity={0.9} background={false} />

      {/* No visible floor mesh — the page's gradient background shows through
          the transparent canvas. A ContactShadow keeps the model grounded
          visually without the horizon line that a MeshReflectorMaterial drew. */}
      <ContactShadows
        position={[0, -1.999, 0]}
        opacity={0.62}
        scale={16}
        blur={3.0}
        far={5}
        resolution={1024}
      />

      <group scale={modelScale} position={centerOffset.toArray()}>
        <primitive object={model} />
      </group>

      <CameraController
        keyframes={keyframes}
        progressRef={progressRef}
        baseRadius={baseRadius}
        sideBiasRef={sideBiasRef}
      />
    </>
  );
}

function CameraController({
  keyframes,
  progressRef,
  baseRadius,
  sideBiasRef,
}: {
  keyframes: SceneConfig["keyframes"];
  progressRef: ProgressRef;
  baseRadius: number;
  sideBiasRef: ProgressRef;
}) {
  const { camera } = useThree();
  const kfs = useMemo(
    () => keyframes.map((k) => ({ p: k[0], orbit: parseOrbit(k[1]) })),
    [keyframes]
  );
  const current = useRef<Orbit>({ ...kfs[0].orbit });
  const bias = useRef(0);

  const sample = (p: number): Orbit => {
    for (let i = 0; i < kfs.length - 1; i++) {
      const a = kfs[i];
      const b = kfs[i + 1];
      if (p >= a.p && p <= b.p) {
        const t = smoothstep((p - a.p) / (b.p - a.p || 1));
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

  useFrame((_, delta) => {
    const p = progressRef.current;
    const target = sample(p);
    // Frame-rate independent critically-damped approach.
    // With scrub: 0.6 already doing most smoothing, this just polishes sub-frame noise.
    const k = 1 - Math.pow(0.0015, delta); // ~99% per second
    current.current.theta = lerp(current.current.theta, target.theta, k);
    current.current.phi = lerp(current.current.phi, target.phi, k);
    current.current.radius = lerp(current.current.radius, target.radius, k);

    // Lerp the side-bias so the shift feels like breathing, not snapping.
    const targetBias = sideBiasRef.current;
    bias.current += (targetBias - bias.current) * (1 - Math.pow(0.02, delta));

    const theta = (current.current.theta * Math.PI) / 180;
    const phi = (current.current.phi * Math.PI) / 180;
    const r = baseRadius * (current.current.radius / 100) * 2.4;

    // Side-bias (world units): move the camera target + camera horizontally
    // so the car visibly shifts to the opposite side of the viewport from the
    // active caption. Strength scales with radius so it reads the same at any
    // zoom level.
    const biasStrength = 0.28 * r;
    const tx = bias.current * biasStrength;

    camera.position.set(
      r * Math.sin(phi) * Math.sin(theta) + tx,
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.cos(theta)
    );
    camera.lookAt(tx, 0, 0);
    camera.updateProjectionMatrix();
  });

  return null;
}

