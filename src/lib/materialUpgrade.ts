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
  // Emissive deliberately NOT copied — for a clean configurator look we
  // never want self-illuminated panels (the new countach GLB ships with
  // bright baked interior gauges and brake-light glows that read as a
  // hot cabin). emissive defaults to (0,0,0); leave it alone.
  [phys.map, phys.normalMap, phys.roughnessMap, phys.metalnessMap].forEach((t) => {
    if (t) t.anisotropy = anisotropy;
  });
}

export function makePhysicalPaint(
  std: THREE.MeshStandardMaterial,
  anisotropy: number
): THREE.MeshPhysicalMaterial {
  // Configurator-clean paint: tight roughness + full clearcoat for a
  // crisp showroom lacquer look. Color/maps from the GLB are preserved.
  const phys = new THREE.MeshPhysicalMaterial();
  transferStdFields(std, phys, anisotropy);
  phys.metalness = 0.9;
  // If the GLB has a baked roughnessMap, multiplying against a fixed
  // 0.1 here flattens all the surface variation the artist authored.
  // When a roughness map is present, use 1.0 so the map drives the
  // value at full strength; only force-clamp when there's no map.
  phys.roughness = std.roughnessMap ? 1.0 : 0.1;
  phys.envMapIntensity = 0.85;
  phys.clearcoat = 1.0;
  phys.clearcoatRoughness = 0.04;
  phys.reflectivity = 1.0;
  phys.needsUpdate = true;
  return phys;
}

export function makePhysicalGlass(
  std: THREE.MeshStandardMaterial,
  anisotropy: number
): THREE.MeshPhysicalMaterial {
  // Plain clear glass. We DROP the GLB's baked roughnessMap/normalMap/
  // metalnessMap on glass meshes — Countach (and others) ships with a
  // grunge roughness map baked into windshield UVs that reads as
  // "cloudy" no matter how low we set roughness. Replace with a uniform
  // smooth surface.
  const phys = new THREE.MeshPhysicalMaterial();
  transferStdFields(std, phys, anisotropy);
  phys.color.setHex(0xffffff);
  phys.map = null;
  phys.roughnessMap = null;
  phys.metalnessMap = null;
  phys.normalMap = null;
  phys.aoMap = null;
  phys.metalness = 0;
  phys.roughness = 0;
  phys.transmission = 1.0;
  phys.thickness = 0.5;
  phys.ior = 1.5;
  phys.transparent = true;
  phys.opacity = 0.15;
  phys.depthWrite = false;
  phys.envMapIntensity = 0.5;
  phys.needsUpdate = true;
  return phys;
}

/** Reset rotation on door-named nodes when the car has no scroll-driven
 *  doorRig. Some GLBs ship with the door already in an open transform —
 *  this puts it back to bind pose. If the open state is encoded in vertex
 *  positions instead of a node transform, this is a no-op (only fix in
 *  that case is to re-export the GLB closed). */
export function resetUnriggedDoors(root: THREE.Object3D, hasDoorRig: boolean): void {
  if (hasDoorRig) return;
  root.traverse((obj) => {
    if (/door|hinge/i.test(obj.name)) {
      obj.rotation.set(0, 0, 0);
      obj.updateMatrix();
    }
  });
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
    const parentName = (mesh.name || "").toLowerCase();
    const combined = `${name} ${parentName}`;

    [std.map, std.normalMap, std.roughnessMap, std.metalnessMap].forEach((t) => {
      if (t) t.anisotropy = opts.anisotropy;
    });

    // Force emissive off on EVERY upgraded material — clean configurator
    // shot, no glowing dashboards, gauges, or brake lights.
    std.emissive.setHex(0x000000);
    std.emissiveMap = null;
    std.emissiveIntensity = 0;

    // 1. Body paint — broad regex catches common naming variants.
    if (/body|paint|exterior|shell|lack|carrosserie|karosserie|lambo|ferrari|porsche|bugatti|mclaren|coachwork/.test(combined)) {
      if (opts.usePhysicalPaint) return makePhysicalPaint(std, opts.anisotropy);
      // Low-tier fallback: still glossy, but no clearcoat shader cost.
      std.metalness = 0.85;
      std.roughness = 0.42;
      std.envMapIntensity = 0.55;
      return std;
    }

    // 2. Glass — broad: english + italian/german/french/spanish/portuguese
    //    + common variants (windscreen, headlamp lens, tail-light glass).
    if (/glass|window|windshield|windscreen|vetro|scheibe|verre|vidrio|vidro|cristal|lens/.test(combined)) {
      if (opts.usePhysicalPaint) return makePhysicalGlass(std, opts.anisotropy);
      // Low-tier: cheap transparent glass. Same map-clearing + depthWrite
      // logic as the Physical path so stacked panes don't fog up.
      std.color.setHex(0xffffff);
      std.map = null;
      std.roughnessMap = null;
      std.metalnessMap = null;
      std.normalMap = null;
      std.aoMap = null;
      std.transparent = true;
      std.opacity = 0.12;
      std.depthWrite = false;
      std.metalness = 0;
      std.roughness = 0;
      std.envMapIntensity = 0.4;
      return std;
    }

    // 3. Carbon / matte interior surfaces — broadened to catch common
    //    cabin material names (leather, seat, plastic, fabric, cockpit,
    //    cabin, console, gauge, steering, panel, trim_inner, headliner).
    //    Interior is also color-darkened: GLBs often ship interiors
    //    pre-lit (baked-in highlights) which read as too bright under
    //    studio lighting that's already adding more.
    if (/carbon|matte|interior|dash|leather|seat|plastic|fabric|cloth|vinyl|cockpit|cabin|console|gauge|dial|steering|headliner|alcantara|suede/.test(combined)) {
      std.color.multiplyScalar(0.45);
      std.roughness = 0.7;
      std.metalness = 0.1;
      std.envMapIntensity = 0.2;
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

    // 6. Property-based glass fallback — catches generic-named glass
    //    (e.g., "Material.001" with the transparent flag set in the
    //    GLB). Runs AFTER explicit name buckets so the McLaren's
    //    windshield (parented under a body node) doesn't get hijacked.
    const isGlassByProperty =
      (mat as THREE.MeshStandardMaterial).transparent === true ||
      ((mat as THREE.MeshStandardMaterial).opacity ?? 1) < 0.99;
    if (isGlassByProperty) {
      if (opts.usePhysicalPaint) return makePhysicalGlass(std, opts.anisotropy);
      std.color.setHex(0xffffff);
      std.map = null;
      std.roughnessMap = null;
      std.metalnessMap = null;
      std.normalMap = null;
      std.aoMap = null;
      std.transparent = true;
      std.opacity = 0.12;
      std.depthWrite = false;
      std.metalness = 0;
      std.roughness = 0;
      std.envMapIntensity = 0.4;
      return std;
    }

    // 7. Final fallback — small trim, badges, interior bits the regex
    //    missed. Modest darkening + low env so unidentified parts read
    //    as the same gallery "neutral" tone as the rest of the cabin.
    std.color.multiplyScalar(0.7);
    std.envMapIntensity = 0.3;
    return std;
  };

  mesh.material = Array.isArray(mesh.material)
    ? mesh.material.map(upgrade)
    : upgrade(mesh.material);
}
