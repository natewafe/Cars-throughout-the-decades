"use client";

import { EffectComposer, SSAO, Bloom, SMAA, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

/** Post-processing pipeline. Order matches the deliverable spec:
 *    SSAO → Bloom → SMAA → Vignette
 *
 *  Tone mapping is NOT a separate pass — Three's renderer applies
 *  ACESFilmicToneMapping on the final blit, and the EffectComposer respects
 *  that when frameBufferType is HalfFloat (drei default in r3f v9).
 *
 *  ChromaticAberration / FilmGrain are intentionally omitted: the page
 *  already paints a CSS grain overlay (body::before) and chromatic
 *  aberration on top of that reads as "broken display" rather than
 *  cinematic. Re-add per-scene if you want them. */
export function ScenePostFX({
  ssaoSamples = 16,
  ssaoRadius = 0.07,
  // SSAO intensity dropped from 22 → 12. At 22 the wheel arches and panel
  // gaps were reading as smudges, which compounded with bloom to look
  // "hazy" across the bodywork. 12 still grounds the car visibly.
  ssaoIntensity = 12,
  // Bloom dropped from 0.4 → 0.18. We were getting a soft glow on every
  // chrome highlight that blurred the bodywork edges.
  bloomIntensity = 0.18,
}: {
  ssaoSamples?: number;
  ssaoRadius?: number;
  ssaoIntensity?: number;
  bloomIntensity?: number;
}) {
  return (
    <EffectComposer multisampling={0} enableNormalPass>
      {/* SSAO — grounds the model with subtle contact darkening under
          wheel arches, in panel gaps, around the door shut-lines. This is
          the single biggest "ray-traced look" win you get without RT. */}
      <SSAO
        blendFunction={BlendFunction.MULTIPLY}
        samples={ssaoSamples}
        radius={ssaoRadius}
        intensity={ssaoIntensity}
        luminanceInfluence={0.6}
        worldDistanceThreshold={0.6}
        worldDistanceFalloff={0.12}
        worldProximityThreshold={0.45}
        worldProximityFalloff={0.12}
      />

      {/* Bloom — high luminance threshold (0.9) so only specular highlights
          on chrome / glass / brake-light glass bloom, not the whole car. */}
      <Bloom
        intensity={bloomIntensity}
        // Threshold raised to 0.95 — only true pure-white highlights
        // (chrome, brake-light glass) bloom now, never paint.
        luminanceThreshold={0.95}
        luminanceSmoothing={0.025}
        mipmapBlur
      />

      {/* SMAA — subpixel-morphological AA. Cheaper than MSAA at high DPR
          and handles foliage-thin chrome trim better than FXAA. */}
      <SMAA />

      {/* Vignette — subtle. Pulls the eye to the car. Spec values. */}
      <Vignette offset={0.5} darkness={0.3} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}
