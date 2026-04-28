"use client";

import { Environment } from "@react-three/drei";

/** Image-based lighting (IBL) probe. Drei's <Environment> internally uses
 *  RGBELoader for .hdr presets and runs the texture through PMREM so it can
 *  drive PBR reflections on MeshStandardMaterial / MeshPhysicalMaterial.
 *
 *  "studio" is a neutral, evenly-lit cubemap — closest to a product-shoot
 *  softbox. "warehouse" is warmer/dirtier. Swap via prop if a car looks too
 *  clinical. */
export function SceneEnvironment({
  preset = "studio",
  intensity = 0.6,
}: {
  preset?: "studio" | "warehouse" | "city" | "apartment" | "dawn" | "sunset" | "forest" | "lobby" | "night" | "park";
  intensity?: number;
}) {
  return <Environment preset={preset} environmentIntensity={intensity} background={false} />;
}
