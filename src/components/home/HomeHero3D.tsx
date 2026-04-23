"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";

/** Standalone R3F showroom for the homepage hero — a slow auto-orbit of the
 * Countach rendered with the same clearcoat/HDRI treatment as the exhibit pages.
 * Client-only (R3F is WebGL). */
export function HomeHero3D() {
  return (
    <div className="home-hero-3d">
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
        camera={{ fov: 28, near: 0.1, far: 500, position: [5, 1.8, 5] }}
      >
        <Suspense fallback={null}>
          <HeroScene />
        </Suspense>
      </Canvas>
    </div>
  );
}

function HeroScene() {
  const { scene: gltf } = useGLTF("/models/countach.glb") as unknown as {
    scene: THREE.Group;
  };
  const groupRef = useRef<THREE.Group | null>(null);

  const { model, scale, offset } = useMemo(() => {
    const cloned = gltf.clone(true);
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const upgrade = (mat: THREE.Material): THREE.Material => {
        const std = (mat as THREE.MeshStandardMaterial).clone();
        std.envMapIntensity = 1.6;
        const name = (std.name || mesh.name || "").toLowerCase();
        if (/paint|body|lack|carrosserie|karosserie|exterior|shell/.test(name)) {
          const phys = new THREE.MeshPhysicalMaterial();
          phys.copy(std as unknown as THREE.MeshPhysicalMaterial);
          phys.clearcoat = 1;
          phys.clearcoatRoughness = 0.08;
          phys.metalness = 0.8;
          phys.roughness = 0.3;
          phys.envMapIntensity = 1.8;
          return phys;
        }
        return std;
      };
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map(upgrade)
        : upgrade(mesh.material);
    });
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const longest = Math.max(size.x, size.y, size.z);
    const s = 4 / longest;
    return {
      model: cloned,
      scale: s,
      offset: center.clone().multiplyScalar(-s),
    };
  }, [gltf]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight
        castShadow
        position={[6, 10, 6]}
        intensity={2.4}
        color={"#ffffff"}
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-6, 4, -4]} intensity={0.8} color={"#dde6ff"} />
      <directionalLight position={[0, 6, -8]} intensity={1.1} color={"#ffe8cc"} />
      <Environment preset="warehouse" environmentIntensity={0.9} />
      <ContactShadows
        position={[0, -1.995, 0]}
        opacity={0.55}
        scale={14}
        blur={2.6}
        far={4}
        resolution={1024}
      />
      <group ref={groupRef} scale={scale} position={offset.toArray()}>
        <primitive object={model} />
      </group>
    </>
  );
}

useGLTF.preload("/models/countach.glb");
