"use client";

import { useEffect, useState } from "react";

/** "Apple style" static capability tier: pick quality up-front based on
 * hardware signals so we don't whiplash the render budget at runtime. The
 * R3F <PerformanceMonitor> in the canvases then trims DPR further if frame
 * time sags. Do NOT read navigator during SSR — hook gates on useEffect. */
export type DeviceTier = "low" | "mid" | "high";

export type QualityProfile = {
  tier: DeviceTier;
  /** [min, max] pixel ratio the R3F Canvas may scale to. */
  dpr: [number, number];
  /** Shadow map edge length. */
  shadowMapSize: number;
  /** HDRI env probe — heavy on low-end Android/old Intel iGPUs. */
  enableEnv: boolean;
  /** ContactShadows render target resolution. */
  contactShadowResolution: number;
  /** Run the post-processing pipeline (SSAO + bloom + anti-alias). Off on
   *  low-tier — SSAO is a 2-3ms hit on integrated GPUs. */
  enablePost: boolean;
  /** Use MeshPhysicalMaterial with clearcoat for paint panels. Slightly
   *  more expensive shader; visibly closer to real lacquer. */
  usePhysicalPaint: boolean;
  /** Texture anisotropy. 8 is the sweet spot for sharp metal/paint at
   *  glancing angles without burning fillrate. */
  anisotropy: number;
};

const PROFILES: Record<DeviceTier, QualityProfile> = {
  low:  { tier: "low",  dpr: [1, 1.25], shadowMapSize: 512,  enableEnv: false, contactShadowResolution: 256,  enablePost: false, usePhysicalPaint: false, anisotropy: 2 },
  mid:  { tier: "mid",  dpr: [1, 1.75], shadowMapSize: 1024, enableEnv: true,  contactShadowResolution: 512,  enablePost: true,  usePhysicalPaint: true,  anisotropy: 8 },
  // high tier now lets DPR climb to 2.5 on retina displays and uses 16x
  // anisotropy. The cars have native 4K textures inside the GLBs — at
  // dpr=2 those textures were being undersampled at glancing angles.
  high: { tier: "high", dpr: [1, 2.5], shadowMapSize: 4096, enableEnv: true,  contactShadowResolution: 2048, enablePost: true,  usePhysicalPaint: true,  anisotropy: 16 },
};

function detect(): DeviceTier {
  if (typeof navigator === "undefined") return "mid";
  const n = navigator as Navigator & { deviceMemory?: number };
  const cores = n.hardwareConcurrency || 4;
  const mem = n.deviceMemory ?? 4;
  const mobile = /Mobi|Android|iPhone|iPad|iPod/i.test(n.userAgent);
  // Low-end phones + old laptops: aggressive floor.
  if (mobile && (cores <= 4 || mem <= 2)) return "low";
  if (cores <= 2 || mem <= 2) return "low";
  // Retina MacBooks / modern desktops.
  if (!mobile && cores >= 8 && mem >= 8) return "high";
  return "mid";
}

export function useQualityProfile(): QualityProfile {
  // Start at "mid" so server-rendered markup is stable, then reconcile.
  const [tier, setTier] = useState<DeviceTier>("mid");
  useEffect(() => {
    setTier(detect());
  }, []);
  return PROFILES[tier];
}
