// Convert public/artifacts/**/*.{jpg,jpeg,png} to .webp (quality 82),
// delete the originals, and rewrite source JSON + artifacts.ts to .webp.
import sharp from "sharp";
import { readdir, readFile, writeFile, unlink, stat } from "node:fs/promises";
import { join, extname, basename } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\//, "");
const PUB_DIR = join(ROOT, "public", "artifacts");
const PS_DIR = join(ROOT, "primary-sources");
const TS_PATH = join(ROOT, "src", "lib", "artifacts.ts");

const INPUT_EXTS = new Set([".jpg", ".jpeg", ".png"]);

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

async function convertAll() {
  const files = await walk(PUB_DIR);
  const renamed = new Map(); // old basename -> new basename
  let savedBytes = 0;
  for (const src of files) {
    const ext = extname(src).toLowerCase();
    if (!INPUT_EXTS.has(ext)) continue;
    const dst = src.slice(0, -ext.length) + ".webp";
    const origSize = (await stat(src)).size;
    try {
      await sharp(src, { failOn: "none" })
        .rotate()
        .webp({ quality: 82, effort: 4 })
        .toFile(dst);
      const newSize = (await stat(dst)).size;
      savedBytes += origSize - newSize;
      await unlink(src);
      renamed.set(basename(src), basename(dst));
      process.stdout.write(`  ${basename(src)} -> .webp (${(origSize/1024).toFixed(0)}KB -> ${(newSize/1024).toFixed(0)}KB)\n`);
    } catch (err) {
      process.stdout.write(`  SKIP ${basename(src)}: ${err.message}\n`);
    }
  }
  console.log(`\nConverted ${renamed.size} files. Saved ${(savedBytes / 1048576).toFixed(1)} MB.\n`);
  return renamed;
}

function rewriteText(text, renamed) {
  let out = text;
  for (const [from, to] of renamed) {
    // Match only the bare filename to avoid accidental substring hits.
    const re = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    out = out.replace(re, to);
  }
  return out;
}

async function rewriteJSONs(renamed) {
  const sources = await walk(PS_DIR);
  for (const f of sources) {
    if (!f.endsWith("sources.json")) continue;
    const orig = await readFile(f, "utf8");
    const next = rewriteText(orig, renamed);
    if (next !== orig) {
      await writeFile(f, next);
      console.log(`  updated ${f.replace(ROOT, ".")}`);
    }
  }
}

async function rewriteTs(renamed) {
  const orig = await readFile(TS_PATH, "utf8");
  const next = rewriteText(orig, renamed);
  if (next !== orig) {
    await writeFile(TS_PATH, next);
    console.log(`  updated ${TS_PATH.replace(ROOT, ".")}`);
  }
}

const renamed = await convertAll();
if (renamed.size) {
  await rewriteJSONs(renamed);
  await rewriteTs(renamed);
}
