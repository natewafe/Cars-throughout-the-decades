"use client";

import { EffectComposer, SSAO, SMAA } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

/** Configurator-clean post-processing. Order:
 *    RenderPass (implicit) → SSAO → SMAA → OutputPass (implicit)
 *
 *  Bloom, Vignette, ChromaticAberration, FilmGrain, DoF, and Fog were
 *  removed — they all push the look toward "cinematic" instead of
 *  "product shot." The car is the only visual subject. */
export function ScenePostFX({
  ssaoRadius = 0.015,
  ssaoIntensity = 6,
}: {
  ssaoRadius?: number;
  ssaoIntensity?: number;
}) {
  return (
    <EffectComposer multisampling={4} enableNormalPass>
      {/* SSAO — subtle. Just darkens wheel arches and panel seams.
          worldDistanceThreshold ≈ kernelRadius equivalent: keeps the
          effect tight around real geometry crevices, not blooming
          across the body. */}
      <SSAO
        blendFunction={BlendFunction.MULTIPLY}
        samples={16}
        radius={ssaoRadius}
        intensity={ssaoIntensity}
        luminanceInfluence={0.5}
        worldDistanceThreshold={0.015}
        worldDistanceFalloff={0.005}
        worldProximityThreshold={0.005}
        worldProximityFalloff={0.001}
      />
      <SMAA />
    </EffectComposer>
  );
}
