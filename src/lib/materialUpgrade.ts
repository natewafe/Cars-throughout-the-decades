import * as THREE from "three";

/** Promote a baked-in MeshStandardMaterial to MeshPhysicalMaterial with the
 *  fields *manually transferred* — never via `phys.copy(std)`, which crashes
 *  because Physical's copy path reads optional fields (clearcoatNormalScale,
 *  sheenColor, specularColor) that Standard doesn't define.
 *
 *  Returns a fresh material; the caller owns disposal. */
function transferStdFields(
  std: THREE.MeshStandardMaterial,
  phys: THREE.MeshPhysicalMaterial,
  anisotropy: number
): void {
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
  [phys.map, phys.normalMap, phys.roughnessMap, phys.metalnessMap].forEach((t) => {
    if (t) t.anisotropy = anisotropy;
  });
}

export function makePhysicalPaint(
  std: THREE.MeshStandardMaterial,
  anisotropy: number
): THREE.MeshPhysicalMaterial {
  const phys = new THREE.MeshPhysicalMaterial();
  transferStdFields(std, phys, anisotropy);
  // Real automotive paint: roughness 0.42 keeps it from reading as wet
  // plastic; clearcoat layer carries the lacquer sheen separately.
  phys.metalness = 0.85;
  phys.roughness = 0.42;
  phys.envMapIntensity = 0.55;
  phys.clearcoat = 0.6;
  phys.clearcoatRoughness = 0.18;
  phys.needsUpdate = true;
  return phys;
}

export function makePhysicalGlass(
  std: THREE.MeshStandardMaterial,
  anisotropy: number
): THREE.MeshPhysicalMaterial {
  const phys = new THREE.MeshPhysicalMaterial();
  transferStdFields(std, phys, anisotropy);
  // Real glass: transmission for refraction, low roughness, no metallic.
  phys.metalness = 0;
  phys.roughness = 0.05;
  phys.transmission = 0.9;
  phys.thickness = 0.5;
  phys.envMapIntensity = 0.8;
  phys.transparent = true;
  // Slight tint preserves the OEM glass look (most car GLBs ship subtle blue).
  phys.needsUpdate = true;
  return phys;
}

/** Single-pass material walker shared by both 3D scenes. Six buckets:
 *  paint, glass, carbon/matte interior, chrome/metal trim, tires, fallback.
 *  All textures get anisotropy bumped; cast/receiveShadow on. */
export function upgradeMaterial(
  mesh: THREE.Mesh,
  opts: { usePhysicalPaint: boolean; anisotropy: number }
): void {
  if (!mesh.isMesh || !mesh.material) return;
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const upgrade = (mat: THREE.Material): THREE.Material => {
    const std = (mat as THREE.MeshStandardMaterial).clone();
    const name = (std.name || mesh.name || "").toLowerCase();

    [std.map, std.normalMap, std.roughnessMap, std.metalnessMap].forEach((t) => {
      if (t) t.anisotropy = opts.anisotropy;
    });

    // 1. Body paint
    if (/body|paint|exterior|shell|lack|carrosserie|karosserie/.test(name)) {
      if (opts.usePhysicalPaint) return makePhysicalPaint(std, opts.anisotropy);
      // Low-tier fallback: still glossy, but no clearcoat shader cost.
      std.metalness = 0.85;
      std.roughness = 0.42;
      std.envMapIntensity = 0.55;
      return std;
    }

    // 2. Glass
    if (/glass|window|windshield|vetro/.test(name)) {
      if (opts.usePhysicalPaint) return makePhysicalGlass(std, opts.anisotropy);
      // Low-tier: cheap transparent glass, no transmission render pass.
      std.transparent = true;
      std.opacity = Math.min(std.opacity, 0.6);
      std.metalness = 0;
      std.roughness = 0.05;
      std.envMapIntensity = 0.8;
      return std;
    }

    // 3. Carbon / matte interior surfaces
    if (/carbon|matte|interior|dash/.test(name)) {
      std.roughness = 0.65;
      std.metalness = 0.2;
      std.envMapIntensity = 0.3;
      return std;
    }

    // 4. Chrome / metal trim
    if (/chrome|trim|exhaust|metal/.test(name)) {
      std.metalness = 1.0;
      std.roughness = 0.15;
      std.envMapIntensity = 0.7;
      return std;
    }

    // 5. Tires / rubber
    if (/tire|rubber|wheel.*tire/.test(name)) {
      std.metalness = 0;
      std.roughness = 0.9;
      std.envMapIntensity = 0.2;
      return std;
    }

    // 6. Fallback — leave roughness/metalness from the GLB; only normalize env.
    std.envMapIntensity = 0.5;
    return std;
  };

  mesh.material = Array.isArray(mesh.material)
    ? mesh.material.map(upgrade)
    : upgrade(mesh.material);
}
