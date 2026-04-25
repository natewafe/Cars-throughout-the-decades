"use client";

/** Three-point showroom lighting. Values tuned for an HDRI-lit scene —
 *  if you remove the <SceneEnvironment>, raise ambient by ~0.3 to compensate. */
export function SceneLighting({ shadowMapSize }: { shadowMapSize: number }) {
  return (
    <>
      {/* Ambient: low (0.2) because the HDRI environment carries most of the
          diffuse fill. With no HDRI, raise this to ~0.5. */}
      <ambientLight intensity={0.2} />

      {/* Key — warm white, casts shadows. Bias is the standard fix for
          shadow acne on glossy paint at glancing angles. */}
      <directionalLight
        castShadow
        position={[6, 10, 6]}
        intensity={1.5}
        color="#ffffff"
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-bias={-0.0001}
        shadow-camera-far={25}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />

      {/* Fill — opposite side, cool tint to subtly cool the shadow side. */}
      <directionalLight
        position={[-6, 4, -4]}
        intensity={0.5}
        color="#dde6ff"
      />

      {/* Rim — from behind, warm tint, separates silhouette from background. */}
      <directionalLight
        position={[0, 6, -8]}
        intensity={1.0}
        color="#ffe8cc"
      />
    </>
  );
}
