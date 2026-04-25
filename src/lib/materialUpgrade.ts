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
  // Real automotive paint roughness lives at 0.35–0.45 — anything tighter
  // than that reads as wet plastic / showroom mannequin instead of car.
  // The clearcoat layer (separate physical lobe) provides the lacquer
  // sheen without forcing the base to be mirror-smooth.
  phys.metalness = Math.max(std.metalness ?? 0.6, 0.7);
  phys.roughness = 0.4;
  phys.envMapIntensity = 0.6;
  phys.clearcoat = 0.5;
  phys.clearcoatRoughness = 0.15;
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
    // Lower than before (was 1.6) — the studio HDRI was previously hot
    // enough to wash out the left side of the car. 0.7 keeps reflections
    // visible without blowing highlights.
    std.envMapIntensity = 0.7;
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
      std.metalness = Math.max(std.metalness ?? 0.6, 0.7);
      std.roughness = 0.4;
      std.envMapIntensity = 0.6;
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
