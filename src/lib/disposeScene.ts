import * as THREE from "three";

/** Dispose the materials we created while cloning a GLTF scene.
 *
 * IMPORTANT: We dispose materials ONLY. `gltfScene.clone(true)` does a shallow
 * clone — the new tree has fresh Mesh nodes but every BufferGeometry is still
 * shared with the cached GLTF scene. Disposing a shared geometry invalidates
 * the cache, so the next consumer (the hero carousel cycling back, or the
 * user navigating to /959 or /f1) gets back a scene whose GPU buffers are
 * gone and renders as empty.
 *
 * Materials are safe to dispose because the per-scene `upgrade()` pass runs
 * `mat.clone()` / `new THREE.MeshPhysicalMaterial()` on every mesh, so each
 * material on the cloned tree is a fresh instance we own outright.
 * Textures are also intentionally skipped — they're owned by `useGLTF`. */
export function disposeClonedScene(root: THREE.Object3D): void {
  const seenMat = new Set<THREE.Material>();

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
    mats.forEach((m) => {
      if (m && !seenMat.has(m)) {
        seenMat.add(m);
        m.dispose();
      }
    });
  });
}
