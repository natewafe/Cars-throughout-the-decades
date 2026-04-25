import * as THREE from "three";

/** Promote a baked-in MeshStandardMaterial to MeshPhysicalMaterial with the
 *  fields *manually transferred* — never via `phys.copy(std)`, which crashes
 *  because Physical's copy path reads optional fields (clearcoatNormalScale,
 *  sheenColor, specularColor) that Standard doesn't define.
 *
 *  Returns a fresh material; the caller owns disposal. */
export function makePhysicalPaint(std: THREE.MeshStandardMaterial, anisotropy: number): THREE.MeshPhysicalMaterial {
  const phys = new THREE.MeshPhysicalMaterial();
  // Base color + maps from std.
  phys.color.copy(std.color);
  phys.map = std.map;
  phys.normalMap = std.normalMap;
  if (std.normalScale) phys.normalScale.copy(std.normalScale);
  phys.roughnessMap = std.roughnessMap;
  phys.metalnessMap = std.metalnessMap;
  phys.aoMap = std.aoMap;
  phys.aoMapIntensity = std.aoMapIntensity ?? 1;
  phys.emissive.copy(std.emissive);
  phys.emissiveMap = std.emissiveMap;
  phys.emissiveIntensity = std.emissiveIntensity ?? 1;
  // Paint-tuned PBR: shiny base + a clearcoat layer for the lacquer.
  phys.metalness = Math.max(std.metalness ?? 0.6, 0.85);
  phys.roughness = Math.min(std.roughness ?? 0.35, 0.28);
  // Spec-aligned: 1.0–1.5. We sit at 1.5 — paint reflects the HDRI strongly
  // but doesn't blow out highlights when bloom kicks in.
  phys.envMapIntensity = 1.5;
  phys.clearcoat = 1.0;
  phys.clearcoatRoughness = 0.06;
  // Bump anisotropy on whatever maps exist.
  [phys.map, phys.normalMap, phys.roughnessMap, phys.metalnessMap].forEach((t) => {
    if (t) t.anisotropy = anisotropy;
  });
  phys.needsUpdate = true;
  return phys;
}

/** Single-pass material walker shared by both 3D scenes.
 *  - Paint panels become MeshPhysicalMaterial w/ clearcoat (when usePhysical).
 *  - Glass becomes a tuned standard material with low roughness.
 *  - Chrome trim gets metalness=1, low roughness.
 *  - All textures get anisotropy bumped.
 *  - castShadow/receiveShadow on. */
export function upgradeMaterial(
  mesh: THREE.Mesh,
  opts: { usePhysicalPaint: boolean; anisotropy: number }
): void {
  if (!mesh.isMesh || !mesh.material) return;
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const upgrade = (mat: THREE.Material): THREE.Material => {
    const std = (mat as THREE.MeshStandardMaterial).clone();
    std.envMapIntensity = 1.6;
    const name = (std.name || mesh.name || "").toLowerCase();

    // Bump anisotropy on any maps already present (glass/trim path).
    [std.map, std.normalMap, std.roughnessMap, std.metalnessMap].forEach((t) => {
      if (t) t.anisotropy = opts.anisotropy;
    });

    if (/paint|body|lack|carrosserie|karosserie|exterior|shell/.test(name)) {
      if (opts.usePhysicalPaint) {
        return makePhysicalPaint(std, opts.anisotropy);
      }
      // Fallback (low tier): glossy std material, no clearcoat.
      std.metalness = Math.max(std.metalness ?? 0.6, 0.8);
      std.roughness = Math.min(std.roughness ?? 0.35, 0.3);
      std.envMapIntensity = 1.8;
      return std;
    }
    if (/glass|window|windshield|vetro/.test(name)) {
      std.transparent = true;
      std.opacity = Math.min(std.opacity, 0.6);
      std.roughness = 0.04;
      std.metalness = 0.0;
      return std;
    }
    if (/chrome|metal.*trim|trim.*metal/.test(name)) {
      std.metalness = 1.0;
      std.roughness = 0.1;
      return std;
    }
    return std;
  };

  mesh.material = Array.isArray(mesh.material)
    ? mesh.material.map(upgrade)
    : upgrade(mesh.material);
}
