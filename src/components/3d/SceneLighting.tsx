"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";

let rectAreaInited = false;
function initRectAreaOnce() {
  if (rectAreaInited) return;
  RectAreaLightUniformsLib.init();
  rectAreaInited = true;
}

/** Three-point showroom rig + 3 rect-area "softbox" lights for studio
 *  photography softness. Rect-area lights are skipped on `low` tier (they
 *  are noticeably more expensive than directional). */
export function SceneLighting({
  shadowMapSize,
  enableSoftbox = true,
}: {
  shadowMapSize: number;
  enableSoftbox?: boolean;
}) {
  useEffect(() => {
    if (enableSoftbox) initRectAreaSafe();
  }, [enableSoftbox]);

  // Aim each rect-area light at the model origin.
  const keyRef = useRef<THREE.RectAreaLight | null>(null);
  const fillRef = useRef<THREE.RectAreaLight | null>(null);
  const kickerRef = useRef<THREE.RectAreaLight | null>(null);
  useEffect(() => {
    [keyRef, fillRef, kickerRef].forEach((r) => {
      if (r.current) r.current.lookAt(0, 0, 0);
    });
  }, [enableSoftbox]);

  return (
    <>
      <ambientLight intensity={0.2} />

      <directionalLight
        castShadow
        position={[6, 10, 6]}
        intensity={1.2}
        color="#ffffff"
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-bias={-0.0001}
        shadow-camera-far={25}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />

      <directionalLight position={[-6, 4, -4]} intensity={0.4} color="#dde6ff" />
      <directionalLight position={[0, 6, -8]} intensity={0.8} color="#ffe8cc" />

      {enableSoftbox && (
        <>
          {/* Key softbox — upper front-left, large. */}
          <rectAreaLight
            ref={keyRef}
            position={[-8, 6, 6]}
            width={6}
            height={6}
            intensity={4}
            color="#ffffff"
          />
          {/* Fill softbox — opposite side, smaller, cooler. */}
          <rectAreaLight
            ref={fillRef}
            position={[6, 4, 4]}
            width={4}
            height={4}
            intensity={1.5}
            color="#dde6ff"
          />
          {/* Kicker / hair light — high above-rear, warm. */}
          <rectAreaLight
            ref={kickerRef}
            position={[0, 8, -6]}
            width={5}
            height={3}
            intensity={2.5}
            color="#ffeacc"
          />
        </>
      )}
    </>
  );
}

function initRectAreaSafe() {
  try {
    initRectAreaOnce();
  } catch {
    // Some build paths can't resolve the examples module — degrade silently
    // rather than break the whole scene.
  }
}
