import * as THREE from "three";

/** Recursively dispose every geometry and material we created while cloning a
 * GLTF scene. Textures are intentionally skipped — they're owned by the
 * `useGLTF` cache and shared with other consumers; disposing them here would
 * break any scene that later reads from the same cache entry.
 *
 * Call this in a useEffect cleanup for every R3F scene that does
 * `gltfScene.clone(true)` + `material.clone()` / `new MeshPhysicalMaterial()`.
 * Without it, each remount leaks WebGL programs/VBOs and the tab eventually
 * runs out of GPU memory. */
export function disposeClonedScene(root: THREE.Object3D): void {
  const seenGeo = new Set<THREE.BufferGeometry>();
  const seenMat = new Set<THREE.Material>();

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;

    if (mesh.geometry && !seenGeo.has(mesh.geometry)) {
      seenGeo.add(mesh.geometry);
      mesh.geometry.dispose();
    }

    const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
    mats.forEach((m) => {
      if (m && !seenMat.has(m)) {
        seenMat.add(m);
        m.dispose();
      }
    });
  });
}
