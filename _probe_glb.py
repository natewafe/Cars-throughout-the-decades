#!/usr/bin/env python3
"""Probe GLB files to enumerate node names and find door/wheel/etc. candidates.
GLB = 12-byte header + chunks. The first chunk is JSON (glTF). We only need that."""

import json
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MODELS = [
    ("countach", "public/models/countach.glb"),
    ("959",      "public/models/959.glb"),
    ("f1",       "public/models/f1.glb"),
    ("veyron",   "public/models/veyron.glb"),
]

DOOR_KEYWORDS = ["door", "porta", "tuer", "tür", "portiere", "scissor", "gullwing", "butterfly"]


def parse_glb_json(path: Path) -> dict:
    data = path.read_bytes()
    # Header: magic (4) + version (4) + total length (4)
    magic, version, length = struct.unpack_from("<III", data, 0)
    assert magic == 0x46546C67, f"bad GLB magic in {path}"
    # First chunk: length (4) + type (4) + data
    chunk_len, chunk_type = struct.unpack_from("<II", data, 12)
    assert chunk_type == 0x4E4F534A, f"first chunk not JSON in {path}"
    json_bytes = data[20 : 20 + chunk_len]
    return json.loads(json_bytes)


def walk(model_name: str, path: Path):
    gltf = parse_glb_json(path)
    nodes = gltf.get("nodes", [])
    meshes = gltf.get("meshes", [])
    anims = gltf.get("animations", [])

    print(f"\n=== {model_name}: {path.name} ===")
    print(f"  nodes: {len(nodes)}, meshes: {len(meshes)}, animations: {len(anims)}")

    # Find door-like nodes
    candidates = []
    for i, node in enumerate(nodes):
        name = node.get("name", "") or ""
        low = name.lower()
        if any(k in low for k in DOOR_KEYWORDS):
            candidates.append((i, name, node))

    if candidates:
        print(f"  door-candidate nodes ({len(candidates)}):")
        for i, name, node in candidates:
            trans = node.get("translation", [0, 0, 0])
            rot = node.get("rotation", [0, 0, 0, 1])
            print(f"    [{i}] {name!r}  translation={trans}")
    else:
        print("  NO nodes named door/porta/scissor/etc.")
        # Print top 30 node names so we can spot near-matches
        print("  first 30 node names:")
        for i, n in enumerate(nodes[:30]):
            print(f"    [{i}] {n.get('name', '<unnamed>')}")

    if anims:
        print(f"  built-in animations:")
        for a in anims:
            print(f"    {a.get('name', '<unnamed>')}")


for name, rel in MODELS:
    walk(name, ROOT / rel)
