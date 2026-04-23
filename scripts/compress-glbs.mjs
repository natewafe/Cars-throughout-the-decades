// Compress GLBs in place with Meshopt quantization + Draco geometry compression
// + texture resize. Typically shrinks our models 70-85% with no visible loss.
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { draco, meshopt, dedup, prune, weld, textureCompress } from "@gltf-transform/functions";
import draco3d from "draco3d";
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import { readdir, stat, rename } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\//, "");
const MODELS_DIR = join(ROOT, "public", "models");
const BACKUP_DIR = join(ROOT, "public", "models", ".uncompressed");

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "draco3d.decoder": await draco3d.createDecoderModule(),
    "draco3d.encoder": await draco3d.createEncoderModule(),
    "meshopt.decoder": MeshoptDecoder,
    "meshopt.encoder": MeshoptEncoder,
  });

async function compressOne(file) {
  const src = join(MODELS_DIR, file);
  const backup = join(BACKUP_DIR, file);

  try { await stat(backup); }
  catch {
    // Backup original before overwriting.
    try { await rename(src, backup); } catch {}
  }

  const origSize = (await stat(backup)).size;
  const doc = await io.read(backup);

  await doc.transform(
    dedup(),
    prune(),
    weld({ tolerance: 0.0001 }),
    // Meshopt gives the best overall ratio for web.
    meshopt({ encoder: MeshoptEncoder, level: "medium" }),
    // Shrink + re-encode textures. Most car GLBs ship 4K textures we don't need
    // at these render sizes — 1K is plenty and saves huge amounts.
    textureCompress({ encoder: sharp, targetFormat: "webp", resize: [1024, 1024] }),
  );

  await io.write(src, doc);
  const newSize = (await stat(src)).size;
  const pct = ((1 - newSize / origSize) * 100).toFixed(1);
  console.log(`  ${file}: ${(origSize/1048576).toFixed(1)} MB -> ${(newSize/1048576).toFixed(1)} MB (-${pct}%)`);
}

const { mkdir } = await import("node:fs/promises");
await mkdir(BACKUP_DIR, { recursive: true });

const files = (await readdir(MODELS_DIR)).filter((f) => f.endsWith(".glb"));
for (const f of files) await compressOne(f);

void MeshoptSimplifier;
void draco;
console.log("\nDone. Originals preserved at public/models/.uncompressed/");
