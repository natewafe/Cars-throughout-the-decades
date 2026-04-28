"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";

let rectAreaInited = false;
function initRectAreaOnce() {
  if (rectAreaInited) return;
  try {
    RectAreaLightUniformsLib.init();
    rectAreaInited = true;
  } catch {
    // Some build paths can't resolve the examples module — fail silent
    // rather than break the whole scene.
  }
}

/** Configurator-style 4-light studio rig:
 *    - Key softbox      (RectAreaLight, warm, dominant)
 *    - Fill softbox     (RectAreaLight, cool, opposite side)
 *    - Rim directional  (separates car from background)
 *    - Ambient          (very low, only fills absolute black)
 *
 *  Note: RectAreaLights cannot cast shadows in three.js — grounding is
 *  handled by <ContactShadows /> in the scene. The rim DirectionalLight
 *  also doesn't castShadow per the spec (we want a single, clean
 *  contact shadow under the car, not stacked light shadows). */
export function SceneLighting({
  shadowMapSize: _shadowMapSize,
}: {
  shadowMapSize: number;
}) {
  // Aim each rect-area light at the car's vertical center.
  const keyRef = useRef<THREE.RectAreaLight | null>(null);
  const fillRef = useRef<THREE.RectAreaLight | null>(null);

  useEffect(() => {
    initRectAreaOnce();
    if (keyRef.current) keyRef.current.lookAt(0, 0.5, 0);
    if (fillRef.current) fillRef.current.lookAt(0, 0.5, 0);
  }, []);

  return (
    <>
      {/* Ambient — barely there. Just lifts pure-black crevices. */}
      <ambientLight intensity={0.12} />

      {/* KEY softbox: warm, dominant, upper-left. */}
      <rectAreaLight
        ref={keyRef}
        color="#fff8ee"
        intensity={5}
        width={8}
        height={5}
        position={[-4, 5, 3]}
      />

      {/* FILL softbox: cool blue-white, opposite side, low energy. */}
      <rectAreaLight
        ref={fillRef}
        color="#cce0ff"
        intensity={1.5}
        width={6}
        height={4}
        position={[4, 3, -2]}
      />

      {/* RIM / separation: keeps the rear of the car off the white void. */}
      <directionalLight
        color="#ffffff"
        intensity={0.4}
        position={[0, 5, -6]}
      />
    </>
  );
}
