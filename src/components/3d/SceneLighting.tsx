"use client";

/** Three-point showroom rig. The earlier rect-area "softbox" additions
 *  were stacking on top of these directional lights AND the HDRI, which
 *  blew out the bodywork and read as a cloudy haze across the car.
 *  Reverted to a clean three-point setup tuned to the warehouse HDRI. */
export function SceneLighting({
  shadowMapSize,
}: {
  shadowMapSize: number;
  // Kept for backwards compat — silently ignored (softboxes are gone).
  enableSoftbox?: boolean;
}) {
  return (
    <>
      {/* Ambient: low because the HDRI carries the diffuse fill. */}
      <ambientLight intensity={0.25} />

      {/* Key — warm white, the only shadow caster. Bias prevents acne on
          glossy paint at glancing angles. */}
      <directionalLight
        castShadow
        position={[6, 10, 6]}
        intensity={1.4}
        color="#ffffff"
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-bias={-0.0001}
        shadow-camera-far={25}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />

      {/* Fill — opposite side, cool tint, lifts shadow side without
          competing with the key. */}
      <directionalLight position={[-6, 4, -4]} intensity={0.45} color="#dde6ff" />

      {/* Rim — from behind, warm, separates silhouette from cyc. */}
      <directionalLight position={[0, 6, -8]} intensity={0.8} color="#ffe8cc" />
    </>
  );
}
