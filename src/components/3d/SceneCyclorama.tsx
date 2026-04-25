"use client";

import { useMemo } from "react";
import * as THREE from "three";

/** Curved cyclorama / infinity-wall floor — the seamless floor-to-wall
 *  sweep used in real photo studios. Built as a 360° lathe sweep around
 *  Y from a 2D profile that goes:
 *
 *    flat floor (radius 0 → 10) → smoothed corner via CatmullRom →
 *    vertical back wall (up to y=5)
 *
 *  Sampled densely near the corner so there's no visible faceting where
 *  the floor curves into the wall. Vertex colors give a subtle
 *  bottom-bright / top-dim gradient implying soft studio bounce light. */
export function SceneCyclorama({ floorY = -0.5 }: { floorY?: number }) {
  const geometry = useMemo(() => {
    // Profile in (radius, y) — the lathe rotates this around the Y axis.
    // Floor segment, then a 5-pt curved corner sampled via CatmullRom,
    // then a tall back wall.
    const cornerStart = new THREE.Vector2(10, floorY);
    const cornerEnd = new THREE.Vector2(11, floorY + 0.8);
    const corner = new THREE.CatmullRomCurve3([
      new THREE.Vector3(cornerStart.x, cornerStart.y, 0),
      new THREE.Vector3(10.4, floorY + 0.05, 0),
      new THREE.Vector3(10.7, floorY + 0.25, 0),
      new THREE.Vector3(10.95, floorY + 0.55, 0),
      new THREE.Vector3(cornerEnd.x, cornerEnd.y, 0),
    ]).getPoints(24);

    const profile: THREE.Vector2[] = [
      new THREE.Vector2(0, floorY),
      new THREE.Vector2(4, floorY),
      new THREE.Vector2(7, floorY),
      cornerStart,
      ...corner.map((p) => new THREE.Vector2(p.x, p.y)),
      cornerEnd,
      new THREE.Vector2(11, floorY + 2.5),
      new THREE.Vector2(11, floorY + 5),
    ];

    const geom = new THREE.LatheGeometry(profile, 96);

    // Vertical gradient via vertex colors — bottom warm cream, top dim.
    const pos = geom.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    // Gradient softened: bottom matches the page bg exactly, top is a
    // hair darker (just enough to imply soft bounce shadow on the wall).
    // Scene fog handles the actual horizon dissolve — the geometry's
    // top edge fades to fog color before the camera ever sees it.
    const bottom = new THREE.Color("#f5f1ea");
    const top = new THREE.Color("#ece6d8");
    const wallTopY = floorY + 5;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const t = THREE.MathUtils.clamp((y - floorY) / (wallTopY - floorY), 0, 1);
      const c = bottom.clone().lerp(top, Math.pow(t, 1.4));
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geom.computeVertexNormals();
    return geom;
  }, [floorY]);

  return (
    <mesh
      geometry={geometry}
      receiveShadow
      // Lathe winds CCW which yields back-facing tris when viewed from
      // inside; render BackSide so we see the inside of the sweep.
    >
      <meshStandardMaterial
        vertexColors
        roughness={0.6}
        metalness={0}
        side={THREE.BackSide}
      />
    </mesh>
  );
}
