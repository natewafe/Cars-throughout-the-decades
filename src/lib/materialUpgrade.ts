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
  phys.transparent = true;
  phys.opacity = 0.12;
  // depthWrite:false stops stacked glass faces (windshield outer+inner,
  // double-pane side windows) from compounding to ~70% opacity. Each
  // pane now contributes its own 0.12 instead of fogging the whole car.
  phys.depthWrite = false;
  // Drop env reflections to a hint — high envMapIntensity on glass
  // throws a reflection of the HDRI back at the camera and reads as haze.
  phys.envMapIntensity = 0.4;
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
