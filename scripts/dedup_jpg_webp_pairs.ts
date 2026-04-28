/**
 * Detect .jpg/.jpeg figures whose subject matches an existing .webp
 * figure within the same car (i.e. the same physical image stored in
 * two formats). For each confirmed pair: drop the .jpg figure entry
 * from artifacts.ts and delete the .jpg file from /public/artifacts/.
 *
 *   Run:  npx tsx scripts/dedup_jpg_webp_pairs.ts
 *
 * Match heuristic:
 *   1. Build a token bag from each figure's blurb + caption (lowercased,
 *      stop-words stripped).
 *   2. For every .jpg figure, score Jaccard similarity against every
 *      .webp figure in the same car. The highest-scoring webp above
 *      threshold 0.45 is the partner.
 *   3. Confirmed pairs: drop the .jpg figure from data; delete the .jpg
 *      from disk; renumber remaining figures sequentially per car.
 *   4. Borderline (max score 0.35–0.45) → flagged for manual review,
 *      NOT removed.
 *
 * Re-runs build_citations.ts at the end (best-effort if not locked).
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  artifactsBySlug,
  type ArtifactFigure,
  type ArtifactItem,
  type CarArtifacts,
} from "../src/lib/artifacts.js";
import { cars } from "../src/lib/cars.js";

const ROOT = process.cwd();
const ARTIFACTS_PATH = path.resolve(ROOT, "src/lib/artifacts.ts");
const PUBLIC_ARTIFACTS = path.resolve(ROOT, "public/artifacts");
const TS = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

const STOP = new Set([
  "the","a","an","of","to","at","in","on","for","and","or","with","that","this",
  "is","was","were","by","from","as","into","via","its","it","be","been","has",
  "have","had","page","photo","photograph","scan","spread","image","editorial",
]);

function tokens(s: string): Set<string> {
  return new Set(
    (s || "")
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter((w) => w && w.length > 2 && !STOP.has(w))
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function isJpg(f: ArtifactFigure): boolean {
  return /\.(jpe?g)$/i.test(f.filename);
}
function isWebp(f: ArtifactFigure): boolean {
  return /\.webp$/i.test(f.filename);
}
function fingerprint(f: ArtifactFigure): Set<string> {
  return tokens(`${f.blurb || ""} ${f.caption || ""} ${f.alt || ""}`);
}

type PairFinding = {
  slug: string;
  jpgFig: ArtifactFigure;
  webpFig: ArtifactFigure;
  score: number;
};
type Borderline = {
  slug: string;
  jpgFig: ArtifactFigure;
  bestWebp: ArtifactFigure | null;
  score: number;
};

const HIGH = 0.45;
const FLAG = 0.30;

const carImgDir: Record<string, string> = {
  countach: "countach",
  "959": "porsche-959",
  f1: "mclaren-f1",
  veyron: "veyron",
};

const confirmedPairs: PairFinding[] = [];
const borderline: Borderline[] = [];

for (const slug of Object.keys(artifactsBySlug)) {
  const data = artifactsBySlug[slug];
  const figs = data.artifacts.filter((i): i is ArtifactFigure => i.kind === "figure");
  const jpgs = figs.filter(isJpg);
  const webps = figs.filter(isWebp);

  for (const jpg of jpgs) {
    const jPrint = fingerprint(jpg);
    let best: { fig: ArtifactFigure; score: number } | null = null;
    for (const wp of webps) {
      const score = jaccard(jPrint, fingerprint(wp));
      if (!best || score > best.score) best = { fig: wp, score };
    }
    if (best && best.score >= HIGH) {
      confirmedPairs.push({ slug, jpgFig: jpg, webpFig: best.fig, score: best.score });
    } else if (best && best.score >= FLAG) {
      borderline.push({ slug, jpgFig: jpg, bestWebp: best.fig, score: best.score });
    } else {
      borderline.push({ slug, jpgFig: jpg, bestWebp: best?.fig ?? null, score: best?.score ?? 0 });
    }
  }
}

// ============================================================
// Apply: drop confirmed-pair .jpg entries, renumber, write
// ============================================================

const droppedFilenamesPerCar = new Map<string, ArtifactFigure[]>();
const dedupedArtifacts: Record<string, CarArtifacts> = {};

for (const slug of Object.keys(artifactsBySlug)) {
  const data = artifactsBySlug[slug];
  const dropFigIds = new Set(
    confirmedPairs.filter((p) => p.slug === slug).map((p) => p.jpgFig.figId)
  );

  let runningFigId = 1;
  const newItems: ArtifactItem[] = [];
  const dropped: ArtifactFigure[] = [];
  for (const item of data.artifacts) {
    if (item.kind === "section") {
      newItems.push(item);
      continue;
    }
    if (dropFigIds.has(item.figId)) {
      dropped.push(item);
      continue;
    }
    newItems.push({ ...item, figId: runningFigId++ });
  }

  dedupedArtifacts[slug] = { ...data, artifacts: newItems };
  if (dropped.length) droppedFilenamesPerCar.set(slug, dropped);
}

// Emit artifacts.ts (preserves order, only changes are removed jpg figs
// and renumbered figIds).
function emitArtifacts(): string {
  const tsString = (s: string) => JSON.stringify(s);
  const emitFig = (f: ArtifactFigure) => [
    `        {`,
    `          kind: "figure",`,
    `          figId: ${f.figId},`,
    `          footnoteN: ${f.footnoteN},`,
    `          filename: ${tsString(f.filename)},`,
    `          alt: ${tsString(f.alt)},`,
    `          blurb: ${tsString(f.blurb)},`,
    `          caption: ${tsString(f.caption)},`,
    `          footnote: ${tsString(f.footnote)},`,
    `          license: ${tsString(f.license)},`,
    `          sourceLink: ${tsString(f.sourceLink)},`,
    `        },`,
  ].join("\n");
  const emitSection = (s: { title: string; tierLabel: string }) =>
    `        { kind: "section", title: ${tsString(s.title)}, tierLabel: ${tsString(s.tierLabel)} },`;

  const header = `// AUTO-GENERATED by _build_nextjs_data.py.
// Per-car artifact figures with primary-source citations. Last
// post-processed by scripts/dedup_jpg_webp_pairs.ts to remove .jpg
// figures that duplicated existing .webp figures in the same car.

export type ArtifactSectionHeader = { kind: "section"; title: string; tierLabel: string };
export type ArtifactFigure = {
  kind: "figure";
  figId: number;
  footnoteN: number;
  filename: string;
  alt: string;
  blurb: string;
  caption: string;
  footnote: string;
  license: string;
  sourceLink: string;
};
export type ArtifactItem = ArtifactSectionHeader | ArtifactFigure;
export type CarArtifacts = {
  primarySource: { bibliography: string; citation: string };
  imgDir: string;
  artifacts: ArtifactItem[];
  footnotes: string[];
};

export const artifactsBySlug: Record<string, CarArtifacts> = {
`;

  const carBlocks = Object.keys(dedupedArtifacts).map((slug) => {
    const car = dedupedArtifacts[slug];
    const items = car.artifacts.map((it) => (it.kind === "section" ? emitSection(it) : emitFig(it))).join("\n");
    const footnotes = car.footnotes.map((fn) => `      ${tsString(fn)},`).join("\n");
    return [
      `  ${tsString(slug)}: {`,
      `    primarySource: {`,
      `      bibliography: ${tsString(car.primarySource.bibliography)},`,
      `      citation: ${tsString(car.primarySource.citation)},`,
      `    },`,
      `    imgDir: ${tsString(car.imgDir)},`,
      `    artifacts: [`,
      items,
      `    ],`,
      `    footnotes: [`,
      footnotes,
      `    ],`,
      `  },`,
    ].join("\n");
  }).join("\n");

  return `${header}${carBlocks}\n};\n`;
}

const original = fs.readFileSync(ARTIFACTS_PATH, "utf8");
fs.writeFileSync(`${ARTIFACTS_PATH}.backup.${TS}`, original, "utf8");
fs.writeFileSync(ARTIFACTS_PATH, emitArtifacts(), "utf8");

// ============================================================
// Delete physical files
// ============================================================

const deletedFiles: string[] = [];
for (const [slug, dropped] of droppedFilenamesPerCar) {
  const dir = path.join(PUBLIC_ARTIFACTS, carImgDir[slug] ?? slug);
  for (const fig of dropped) {
    const p = path.join(dir, fig.filename);
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      deletedFiles.push(`${carImgDir[slug] ?? slug}/${fig.filename}`);
    }
  }
}

// ============================================================
// Report
// ============================================================

const carDisplay: Record<string, string> = {
  countach: "Lamborghini Countach",
  "959": "Porsche 959",
  f1: "McLaren F1",
  veyron: "Bugatti Veyron",
};

console.log(`\n=== JPG/WEBP DUPLICATE PAIRS ===\n`);
for (const car of cars) {
  const slug = car.slug;
  const pairs = confirmedPairs.filter((p) => p.slug === slug);
  console.log(`${carDisplay[slug] ?? slug}: ${pairs.length} duplicate pairs found`);
  if (pairs.length) {
    console.log(`  Removed from artifacts.ts:`);
    for (const p of pairs) {
      console.log(`    fig ${p.jpgFig.figId}: ${p.jpgFig.filename}`);
      console.log(`      → matched .webp: ${p.webpFig.filename}  (Jaccard ${p.score.toFixed(2)})`);
    }
    console.log(`  Deleted from /public/artifacts/${carImgDir[slug]}/:`);
    for (const f of deletedFiles.filter((x) => x.startsWith(`${carImgDir[slug]}/`))) {
      console.log(`    ${f.split("/")[1]}`);
    }
  }
  console.log();
}

if (borderline.length) {
  console.log(`=== Borderline / unmatched .jpg figures (NOT removed — review manually) ===\n`);
  for (const b of borderline) {
    const where = b.bestWebp ? `nearest .webp ${b.bestWebp.filename} (score ${b.score.toFixed(2)})` : "no .webp candidates";
    console.log(`  [${b.slug}] fig ${b.jpgFig.figId}: ${b.jpgFig.filename}`);
    console.log(`     blurb: ${truncate(b.jpgFig.blurb, 110)}`);
    console.log(`     ${where}`);
    console.log();
  }
}

// Re-run build_citations.ts (best-effort)
const r = spawnSync("npx", ["tsx", "scripts/build_citations.ts"], { cwd: ROOT, stdio: "inherit", shell: true });
if (r.status !== 0) {
  console.warn(`⚠  CITATIONS.md regen failed (file likely open in editor). Run manually after closing it.`);
}

console.log(`\nBackup: src/lib/artifacts.ts.backup.${TS}`);

function truncate(s: string, n: number): string {
  const flat = (s || "").replace(/\s+/g, " ");
  return flat.length > n ? flat.slice(0, n) + "…" : flat;
}
