/**
 * Detect and remove duplicate artifact figures (per-car) and duplicate
 * bibliography entries (site-wide). Rewrites the data modules in place.
 *
 *   Run:  npx tsx scripts/dedup_content.ts
 *
 * Strategy:
 *   FIGURES — group items by a normalized fingerprint that ignores file
 *     extension and folds whitespace/punctuation. The fingerprint pulls
 *     from blurb + caption + alt + footnote so two figures describing the
 *     same artifact collapse even when filenames differ. When a group has
 *     more than one entry, prefer the .webp file; remove the rest.
 *
 *   BIBLIOGRAPHY — group entries by normalized author + title fingerprint
 *     (lowercased, punctuation/whitespace stripped, leading article and
 *     italics markup removed). When a group has multiples, keep the
 *     entry with the longest text (heuristic: most-complete = longest).
 *     Re-alphabetize by author last name.
 *
 * Output:
 *   - Backups of both files at <file>.backup.<timestamp>
 *   - Rewritten src/lib/artifacts.ts and src/lib/bibliography.ts
 *   - A summary report to stdout
 *   - Flags any "borderline" groups for human review
 */

import fs from "node:fs";
import path from "node:path";
import {
  artifactsBySlug,
  type ArtifactFigure,
  type ArtifactItem,
  type CarArtifacts,
} from "../src/lib/artifacts.js";
import { bibliography } from "../src/lib/bibliography.js";
import { cars } from "../src/lib/cars.js";

const ROOT = process.cwd();
const ARTIFACTS_PATH = path.resolve(ROOT, "src/lib/artifacts.ts");
const BIB_PATH = path.resolve(ROOT, "src/lib/bibliography.ts");
const TS = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

// ============================================================
// Fingerprinting helpers
// ============================================================

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ -⯿]/g, " ")  // unicode punct → space
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function stripExt(filename: string): string {
  return filename.replace(/\.(webp|jpe?g|png|gif|bmp|tiff?)$/i, "");
}

/** Fingerprint a figure by its descriptive content + filename stem.
 *  Same subject + same blurb across .webp and .jpg → identical key. */
function fingerprintFigure(f: ArtifactFigure): string {
  const stem = normalize(stripExt(f.filename));
  const blurb = normalize(f.blurb || "");
  const caption = normalize(f.caption || "");
  const alt = normalize(f.alt || "");
  // The most reliable single identifier across our duplicates is the
  // filename stem — magazine scans use the same stem for .webp + .jpg.
  // Blurb is the secondary tiebreak (catches different filenames that
  // describe the exact same artifact).
  return `${stem}|${blurb || alt || caption}`;
}

// ============================================================
// Bibliography fingerprint: author surname + first 60 normalized chars
// ============================================================

function bibFingerprint(entry: string): string {
  const cleaned = entry
    .replace(/\*([^*]+)\*/g, "$1")  // strip italic markers
    .replace(/[“”"]/g, "")
    .trim();
  // First word of the entry is usually "Surname," (Chicago author-date)
  const surname = normalize(cleaned.split(/[,.]/)[0] || "");
  // Take everything up to the first comma after surname for title-ish
  const rest = normalize(cleaned).split(" ").slice(1, 12).join(" ");
  return `${surname}|${rest}`.slice(0, 200);
}

// ============================================================
// FIGURE DEDUPLICATION
// ============================================================

type FigureChange = {
  slug: string;
  removedFigId: number;
  removedFilename: string;
  keptFigId: number;
  keptFilename: string;
};

type BorderlineGroup = {
  slug: string;
  entries: { figId: number; filename: string; blurb: string }[];
  reason: string;
};

const figureChanges: FigureChange[] = [];
const figureBorderline: BorderlineGroup[] = [];

const dedupedArtifacts: Record<string, CarArtifacts> = {};

for (const slug of Object.keys(artifactsBySlug)) {
  const original = artifactsBySlug[slug];
  // Group items: keep section headers in order; collapse figure dups.
  const groups = new Map<string, ArtifactFigure[]>();
  const flattened: ArtifactItem[] = [];
  for (const item of original.artifacts) {
    if (item.kind === "section") {
      flattened.push(item);
      continue;
    }
    const key = fingerprintFigure(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
    flattened.push(item);
  }

  // Within each group, choose the keeper.
  const keeperByKey = new Map<string, ArtifactFigure>();
  for (const [key, figs] of groups) {
    if (figs.length === 1) {
      keeperByKey.set(key, figs[0]);
      continue;
    }
    // Prefer .webp; otherwise prefer largest figId (later, fuller version);
    // otherwise first.
    const webp = figs.find((f) => /\.webp$/i.test(f.filename));
    const keeper = webp ?? figs.reduce((a, b) => (a.figId > b.figId ? a : b));
    keeperByKey.set(key, keeper);
    for (const f of figs) {
      if (f === keeper) continue;
      figureChanges.push({
        slug,
        removedFigId: f.figId,
        removedFilename: f.filename,
        keptFigId: keeper.figId,
        keptFilename: keeper.filename,
      });
    }
    // Borderline: same fingerprint but quite different blurbs → flag.
    const blurbs = new Set(figs.map((f) => normalize(f.blurb || "")));
    if (blurbs.size > 1 && figs.some((f) => (f.blurb || "").length > 50)) {
      figureBorderline.push({
        slug,
        entries: figs.map((f) => ({
          figId: f.figId,
          filename: f.filename,
          blurb: f.blurb,
        })),
        reason: "Same filename stem but different blurbs — verify these really describe the same artifact.",
      });
    }
  }

  // Walk original items, keep section headers, keep figures that are
  // the chosen keeper for their group; renumber figIds sequentially.
  let runningFigId = 1;
  const newItems: ArtifactItem[] = [];
  const seenKeys = new Set<string>();
  for (const item of original.artifacts) {
    if (item.kind === "section") {
      newItems.push(item);
      continue;
    }
    const key = fingerprintFigure(item);
    if (seenKeys.has(key)) continue; // duplicate, already kept the keeper
    const keeper = keeperByKey.get(key)!;
    if (item.figId !== keeper.figId) continue; // not the keeper, skip
    seenKeys.add(key);
    newItems.push({ ...keeper, figId: runningFigId });
    runningFigId++;
  }

  dedupedArtifacts[slug] = {
    ...original,
    artifacts: newItems,
  };
}

// ============================================================
// BIBLIOGRAPHY DEDUPLICATION
// ============================================================

type BibChange = { removedIndex: number; removedText: string; keptText: string };
const bibChanges: BibChange[] = [];
const bibBorderline: { entries: string[]; reason: string }[] = [];

const bibGroups = new Map<string, string[]>();
for (const entry of bibliography) {
  const key = bibFingerprint(entry);
  if (!bibGroups.has(key)) bibGroups.set(key, []);
  bibGroups.get(key)!.push(entry);
}

const dedupedBib: string[] = [];
for (const [_key, entries] of bibGroups) {
  if (entries.length === 1) {
    dedupedBib.push(entries[0]);
    continue;
  }
  // Keep the longest (most complete) entry.
  const keeper = entries.reduce((a, b) => (b.length > a.length ? b : a));
  dedupedBib.push(keeper);
  for (const e of entries) {
    if (e === keeper) continue;
    bibChanges.push({
      removedIndex: bibliography.indexOf(e),
      removedText: e,
      keptText: keeper,
    });
  }
  // Borderline: collapsed entries differ a lot — flag.
  const lens = entries.map((e) => e.length);
  const ratio = Math.min(...lens) / Math.max(...lens);
  if (ratio < 0.6) {
    bibBorderline.push({
      entries,
      reason: "Entries with the same author/title fingerprint had very different lengths — confirm they describe the same source.",
    });
  }
}

// Re-alphabetize by author surname (text up to first comma).
dedupedBib.sort((a, b) => {
  const ka = (a.split(",")[0] || "").toLowerCase();
  const kb = (b.split(",")[0] || "").toLowerCase();
  return ka.localeCompare(kb);
});

// ============================================================
// Emit new source files
// ============================================================

function tsString(s: string): string {
  return JSON.stringify(s);
}

function emitFigure(f: ArtifactFigure, indent = "        "): string {
  return [
    `${indent}{`,
    `${indent}  kind: "figure",`,
    `${indent}  figId: ${f.figId},`,
    `${indent}  footnoteN: ${f.footnoteN},`,
    `${indent}  filename: ${tsString(f.filename)},`,
    `${indent}  alt: ${tsString(f.alt)},`,
    `${indent}  blurb: ${tsString(f.blurb)},`,
    `${indent}  caption: ${tsString(f.caption)},`,
    `${indent}  footnote: ${tsString(f.footnote)},`,
    `${indent}  license: ${tsString(f.license)},`,
    `${indent}  sourceLink: ${tsString(f.sourceLink)},`,
    `${indent}},`,
  ].join("\n");
}

function emitSection(s: { kind: "section"; title: string; tierLabel: string }, indent = "        "): string {
  return `${indent}{ kind: "section", title: ${tsString(s.title)}, tierLabel: ${tsString(s.tierLabel)} },`;
}

function emitArtifactsFile(): string {
  const header = `// AUTO-GENERATED by _build_nextjs_data.py.
// Per-car artifact figures with primary-source citations.
// NOTE: this file was post-processed by scripts/dedup_content.ts to remove
// duplicate figure entries. Re-running the Python build will regenerate
// from scratch and wipe these dedup edits.

export type ArtifactSectionHeader = {
  kind: "section";
  title: string;
  tierLabel: string;
};
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

  const cars = Object.keys(dedupedArtifacts);
  const carBlocks = cars.map((slug) => {
    const car = dedupedArtifacts[slug];
    const items = car.artifacts.map((item) => {
      if (item.kind === "section") return emitSection(item);
      return emitFigure(item);
    }).join("\n");
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

function emitBibliographyFile(): string {
  const header = `// AUTO-GENERATED by _build_nextjs_data.py.
// Bibliography, deduplicated by scripts/dedup_content.ts and
// re-alphabetized by author surname. Re-running the Python build will
// regenerate from scratch and wipe these dedup edits.

export const bibliography: string[] = [
`;
  const entries = dedupedBib.map((e) => `  ${tsString(e)},`).join("\n");
  return `${header}${entries}\n];\n`;
}

// ============================================================
// Write files (with backups)
// ============================================================

function backupAndWrite(filePath: string, contents: string) {
  const original = fs.readFileSync(filePath, "utf8");
  fs.writeFileSync(`${filePath}.backup.${TS}`, original, "utf8");
  fs.writeFileSync(filePath, contents, "utf8");
}

backupAndWrite(ARTIFACTS_PATH, emitArtifactsFile());
backupAndWrite(BIB_PATH, emitBibliographyFile());

// ============================================================
// Report
// ============================================================

console.log(`\n=== DEDUP COMPLETE ===\n`);

const removedByCar = new Map<string, FigureChange[]>();
for (const c of figureChanges) {
  if (!removedByCar.has(c.slug)) removedByCar.set(c.slug, []);
  removedByCar.get(c.slug)!.push(c);
}

console.log(`FIGURES`);
for (const car of cars) {
  const removed = removedByCar.get(car.slug)?.length ?? 0;
  const final = dedupedArtifacts[car.slug]?.artifacts.filter((i) => i.kind === "figure").length ?? 0;
  console.log(`  ${car.maker} ${car.name} (${car.slug}): removed ${removed} duplicates → ${final} figures`);
}
console.log();

console.log(`BIBLIOGRAPHY`);
console.log(`  Removed ${bibChanges.length} duplicate entries → ${dedupedBib.length} entries`);
console.log();

if (figureBorderline.length || bibBorderline.length) {
  console.log(`=== BORDERLINE — please review ===\n`);
  for (const b of figureBorderline) {
    console.log(`  [figures · ${b.slug}] ${b.reason}`);
    for (const e of b.entries) {
      console.log(`    fig ${e.figId} (${e.filename}): ${truncate(e.blurb, 100)}`);
    }
    console.log();
  }
  for (const b of bibBorderline) {
    console.log(`  [bibliography] ${b.reason}`);
    for (const e of b.entries) console.log(`    ${truncate(e, 140)}`);
    console.log();
  }
} else {
  console.log(`No borderline cases — all dedup decisions were unambiguous.`);
}

console.log(`\nBackups: ${path.relative(ROOT, ARTIFACTS_PATH)}.backup.${TS}`);
console.log(`         ${path.relative(ROOT, BIB_PATH)}.backup.${TS}`);

function truncate(s: string, n: number): string {
  const flat = (s || "").replace(/\s+/g, " ");
  return flat.length > n ? flat.slice(0, n) + "…" : flat;
}
