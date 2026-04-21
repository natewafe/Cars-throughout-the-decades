"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, ContactShadows, Float } from "@react-three/drei";
import { Suspense, useRef } from "react";
import type { Mesh } from "three";

/**
 * Sculpted placeholder form — a stylised wedge silhouette that evokes
 * the Countach's profile. Replaced per-car when a real GLB is supplied.
 */
function WedgePlaceholder({ accent = "#b07a2b" }: { accent?: string }) {
  const body = useRef<Mesh>(null);

  useFrame((state) => {
    if (!body.current) return;
    body.current.rotation.y = state.clock.getElapsedTime() * 0.25;
  });

  return (
    <group ref={body} position={[0, -0.2, 0]}>
      {/* main body — elongated wedge */}
      <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
        <boxGeometry args={[4, 0.7, 1.6]} />
        <meshStandardMaterial color="#1a1715" metalness={0.85} roughness={0.2} />
      </mesh>
      {/* cabin slope */}
      <mesh castShadow position={[-0.25, 0.95, 0]} rotation={[0, 0, -0.12]}>
        <boxGeometry args={[2.2, 0.5, 1.5]} />
        <meshStandardMaterial color="#0d0b0a" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* accent stripe */}
      <mesh position={[0, 0.76, 0.81]}>
        <boxGeometry args={[3.6, 0.02, 0.02]} />
        <meshStandardMaterial color={accent} metalness={0.9} roughness={0.15} emissive={accent} emissiveIntensity={0.15} />
      </mesh>
      {/* wheels */}
      {[[-1.4, 0, 0.75], [1.4, 0, 0.75], [-1.4, 0, -0.75], [1.4, 0, -0.75]].map(
        ([x, y, z], i) => (
          <mesh key={i} castShadow position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.35, 0.35, 0.3, 32]} />
            <meshStandardMaterial color="#0a0807" metalness={0.4} roughness={0.7} />
          </mesh>
        )
      )}
    </group>
  );
}

export function CarModel({ accent }: { accent?: string }) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [5, 2.2, 5.5], fov: 28 }}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={["#00000000"]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[6, 8, 4]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <Suspense fallback={null}>
        <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.4}>
          <WedgePlaceholder accent={accent} />
        </Float>
        <ContactShadows
          position={[0, -0.2, 0]}
          opacity={0.45}
          scale={10}
          blur={2.5}
          far={4}
        />
        <Environment preset="studio" />
      </Suspense>
    </Canvas>
  );
}
