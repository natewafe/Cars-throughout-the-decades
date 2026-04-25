"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, PerformanceMonitor, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { disposeClonedScene } from "@/lib/disposeScene";
import { upgradeMaterial } from "@/lib/materialUpgrade";
import { useQualityProfile } from "@/lib/deviceTier";
import { SceneLighting } from "@/components/3d/SceneLighting";
import { SceneEnvironment } from "@/components/3d/SceneEnvironment";
import { ScenePostFX } from "@/components/3d/ScenePostFX";

/** Carousel of hero cars with distinct close-up framings per car, plus a
 * "Coming Soon" fifth slot rendered as a typographic plate (no model).
 *
 * Only one GLB is mounted at a time and prior ones are released from the
 * useGLTF cache on switch — this keeps memory bounded so the hero can live on
 * the same site as the per-exhibit scroll scene without stacking GPU cost. */

type HeroCar = {
  slug: string;
  url: string | null;
  label: string;
  decade: string;
  eyebrow: string;
  /** Spherical camera framing: [azimuth deg, polar deg, radius multiplier].
   *  Detail shots use tighter radii and off-center azimuths. */
  framing: [number, number, number];
  /** Rotation speed (rad/sec) while active; low values give a slow detail pan. */
  spin: number;
  /** Optional constant Y-offset added after grounding (world units). */
  yBias: number;
};

const HERO_CARS: HeroCar[] = [
  {
    slug: "countach",
    url: "/models/countach.glb",
    label: "Lamborghini Countach",
    decade: "1974 · Sant'Agata",
    eyebrow: "Now Showing · Room I",
    framing: [45, 76, 0.58],
    spin: 0.12,
    yBias: 0.15,
  },
  {
    slug: "959",
    url: "/models/959.glb",
    label: "Porsche 959",
    decade: "1986 · Zuffenhausen",
    eyebrow: "Room II · Detail",
    framing: [125, 82, 0.62],
    spin: 0.08,
    yBias: 0.1,
  },
  {
    slug: "f1",
    url: "/models/f1.glb",
    label: "McLaren F1",
    decade: "1992 · Woking",
    eyebrow: "Room III · Detail",
    framing: [-40, 72, 0.55],
    spin: 0.1,
    yBias: 0.1,
  },
  {
    slug: "veyron",
    url: "/models/veyron.glb",
    label: "Bugatti Veyron 16.4",
    decade: "2005 · Molsheim",
    eyebrow: "Room IV · Detail",
    framing: [160, 80, 0.6],
    spin: 0.09,
    yBias: 0.1,
  },
  {
    slug: "coming-soon",
    url: null,
    label: "Ferrari SF90 Stradale",
    decade: "2020 · Maranello",
    eyebrow: "Gallery V · Coming Soon",
    framing: [0, 80, 1],
    spin: 0,
    yBias: 0,
  },
];

const CYCLE_MS = 6500;

export function HomeHero3D() {
  const [active, setActive] = useState(0);
  const [dprCap, setDprCap] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const visibleRef = useRef(true);
  const quality = useQualityProfile();

  useEffect(() => {
    // Only remount the heavy HeroCarModel (which re-clones ~50 materials) while
    // the tab is visible AND the hero is on-screen. Without this, the carousel
    // leaks WebGL programs every 6.5s forever, which is the dominant cause of
    // the tab-crash after ~60s of dwell on the homepage.
    const onVis = () => {
      visibleRef.current =
        document.visibilityState === "visible" && visibleRef.current !== false;
    };
    document.addEventListener("visibilitychange", onVis);

    let onScreen = true;
    const io =
      wrapRef.current && "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => {
              onScreen = entries[0]?.isIntersecting ?? true;
            },
            { threshold: 0.05 }
          )
        : null;
    if (io && wrapRef.current) io.observe(wrapRef.current);

    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible" || !onScreen) return;
      setActive((i) => (i + 1) % HERO_CARS.length);
    }, CYCLE_MS);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      io?.disconnect();
      window.clearInterval(id);
    };
  }, []);

  const car = HERO_CARS[active];

  return (
    <div className="home-hero-3d-wrap" ref={wrapRef}>
      <div className="home-hero-3d">
        <Canvas
          dpr={[quality.dpr[0], Math.min(quality.dpr[1], dprCap ?? quality.dpr[1])]}
          shadows={quality.shadowMapSize > 0 ? { type: THREE.PCFSoftShadowMap } : false}
          gl={{
            // antialias off on low-end — MSAA is a 2-4x fragment cost and the
            // DPR downscale alone is usually enough smoothing there.
            antialias: quality.tier !== "low",
            alpha: true,
            powerPreference: "high-performance",
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.05,
          }}
          camera={{ fov: 28, near: 0.1, far: 500, position: [5, 1.8, 5] }}
        >
          {/* Apple-style: if frame time sags past ~45 fps for a second,
              drop pixel ratio one notch. Climbs back once the device recovers.
              The static tier still sets the CEILING; PerformanceMonitor only
              drops below it, never above. */}
          <PerformanceMonitor
            bounds={(_refreshrate) => [45, 60]}
            onIncline={() => setDprCap((c) => (c && c < quality.dpr[1] ? c + 0.25 : null))}
            onDecline={() => setDprCap((c) => Math.max(1, (c ?? quality.dpr[1]) - 0.25))}
          />
          <Suspense fallback={null}>
            {car.url ? <HeroCarModel key={car.slug} car={car} quality={quality} /> : null}
            <SceneLighting shadowMapSize={quality.shadowMapSize} />
            {quality.enableEnv && <SceneEnvironment preset="studio" intensity={1.0} />}
            {quality.enablePost && <ScenePostFX />}
          </Suspense>
        </Canvas>

        {!car.url && (
          <div className="hero-coming-soon">
            <span className="hero-coming-kicker">Next Exhibit</span>
            <span className="hero-coming-title">{car.label}</span>
            <span className="hero-coming-sub">A fifth room is being installed.</span>
          </div>
        )}
      </div>

      <div className="home-hero-stage-label">
        <span className="eyebrow">{car.eyebrow}</span>
        <span className="stage-title">{car.label}</span>
        <span className="stage-meta">{car.decade}</span>
        <div className="stage-pips" role="tablist" aria-label="Featured cars">
          {HERO_CARS.map((c, i) => (
            <button
              key={c.slug}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={c.label}
              className={`stage-pip${i === active ? " is-active" : ""}`}
              onClick={() => setActive(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroCarModel({
  car,
  quality,
}: {
  car: HeroCar;
  quality: ReturnType<typeof useQualityProfile>;
}) {
  const { scene: gltf } = useGLTF(car.url!) as unknown as { scene: THREE.Group };
  const groupRef = useRef<THREE.Group | null>(null);

  const { model, scale, offset } = useMemo(() => {
    const cloned = gltf.clone(true);
    cloned.traverse((obj) => {
      upgradeMaterial(obj as THREE.Mesh, {
        usePhysicalPaint: quality.usePhysicalPaint,
        anisotropy: quality.anisotropy,
      });
    });
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const longest = Math.max(size.x, size.y, size.z);
    const s = 4 / longest;
    // Ground the model: translate XZ to center, translate Y so bbox.min.y == 0.
    const offs = new THREE.Vector3(-center.x * s, -box.min.y * s, -center.z * s);
    return { model: cloned, scale: s, offset: offs };
  }, [gltf, quality.usePhysicalPaint, quality.anisotropy]);

  // On unmount (next carousel tick), dispose the cloned geometries &
  // materials we created in the useMemo above — these are NOT reclaimed by
  // useGLTF.clear, and are the WebGL resources that leak per cycle.
  useEffect(() => {
    const url = car.url!;
    return () => {
      disposeClonedScene(model);
      try {
        useGLTF.clear(url);
      } catch {
        /* noop */
      }
    };
  }, [car.url, model]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * car.spin;
    }
  });

  return (
    <>
      <HeroCamera framing={car.framing} />
      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.58}
        scale={14}
        blur={2.6}
        far={4}
        resolution={quality.contactShadowResolution}
      />
      <group ref={groupRef} scale={scale} position={[offset.x, offset.y + car.yBias, offset.z]}>
        <primitive object={model} />
      </group>
    </>
  );
}

function HeroCamera({ framing }: { framing: [number, number, number] }) {
  const { camera } = useThree();
  const current = useRef({ theta: framing[0], phi: framing[1], r: framing[2] });

  useFrame((_, delta) => {
    const [thetaDeg, phiDeg, radius] = framing;
    const k = 1 - Math.pow(0.001, delta);
    current.current.theta += (thetaDeg - current.current.theta) * k;
    current.current.phi += (phiDeg - current.current.phi) * k;
    current.current.r += (radius - current.current.r) * k;
    const theta = (current.current.theta * Math.PI) / 180;
    const phi = (current.current.phi * Math.PI) / 180;
    // 7.6 (was 6) gives extra headroom so the silhouette never crops at the
    // viewport edges during the idle spin — at 6 the longer cars (Veyron, F1)
    // would clip on wide screens at certain azimuths.
    const r = 7.6 * current.current.r;
    camera.position.set(
      r * Math.sin(phi) * Math.sin(theta),
      Math.max(0.4, r * Math.cos(phi) + 1.0),
      r * Math.sin(phi) * Math.cos(theta)
    );
    camera.lookAt(0, 0.9, 0);
    camera.updateProjectionMatrix();
  });

  return null;
}
