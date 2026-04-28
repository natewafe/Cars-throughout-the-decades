/**
 * Two-pass bibliography cleanup.
 *
 *   Run:  npx tsx scripts/cleanup_bibliography.ts
 *
 * Pass 1 — orphan removal:
 *   For each bib entry, look for evidence that a surviving figure in
 *   artifacts.ts references it. Evidence is:
 *     a) the bib entry's URL appears as a substring of any figure's
 *        sourceLink (or vice versa), OR
 *     b) the bib entry's author surname + at least one distinctive
 *        title word both appear in some figure's caption + footnote
 *        + sourceLink stem.
 *   Entries with NO evidence are dropped as orphans.
 *
 * Pass 2 — dedup:
 *   Group remaining entries by (authorSurname, normalizedTitle stem).
 *   When a group has multiples, keep the longest (most complete);
 *   prefer entries with a URL.
 *
 * Both passes report what was removed and flag borderline cases.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { artifactsBySlug, type ArtifactFigure } from "../src/lib/artifacts.js";
import { bibliography } from "../src/lib/bibliography.js";

const ROOT = process.cwd();
const BIB_PATH = path.resolve(ROOT, "src/lib/bibliography.ts");
const TS = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

// ============================================================
// Tokenization helpers
// ============================================================

const STOP = new Set([
  "the","a","an","of","to","at","in","on","for","and","or","with","that","this",
  "is","was","were","by","from","as","into","via","its","it","be","been","has",
  "have","had","photo","photograph","scan","spread","page","image","editorial",
  "wikimedia","commons","cc","by","sa","public","domain","fair","use","educational",
  "press","release","jpg","jpeg","webp","png","https","http","www","com","org",
  "file",
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

function urls(s: string): string[] {
  const re = /https?:\/\/\S+/g;
  return (s.match(re) ?? []).map((u) => u.replace(/[).,]+$/, ""));
}

function urlPath(u: string): string {
  // Strip protocol/host/query, keep just the path's tail (filename).
  try {
    const url = new URL(u);
    return decodeURIComponent(url.pathname).toLowerCase();
  } catch {
    return u.toLowerCase();
  }
}

// ============================================================
// Build surviving-figure index
// ============================================================

const surviving: ArtifactFigure[] = [];
for (const slug of Object.keys(artifactsBySlug)) {
  for (const item of artifactsBySlug[slug].artifacts) {
    if (item.kind === "figure") surviving.push(item);
  }
}

const figTokens = surviving.map((f) =>
  tokens(`${f.blurb || ""} ${f.caption || ""} ${f.alt || ""} ${f.footnote || ""} ${urlPath(f.sourceLink || "")}`)
);
const figUrlPaths = surviving.map((f) => urlPath(f.sourceLink || ""));

// ============================================================
// Pass 1 — orphan removal
// ============================================================

function authorSurname(entry: string): string {
  const stripped = entry.replace(/\*([^*]+)\*/g, "$1").trim();
  const sepIdx = (() => {
    const a = stripped.indexOf(",");
    const b = stripped.indexOf(".");
    if (a < 0) return b;
    if (b < 0) return a;
    return Math.min(a, b);
  })();
  const firstChunk = sepIdx > 0 ? stripped.slice(0, sepIdx) : stripped;
  const charAfter = sepIdx > 0 ? stripped[sepIdx] : "";
  if (charAfter === ",") {
    // "Surname, Given" — return the surname (first word of chunk).
    return firstChunk.split(/\s+/)[0].toLowerCase();
  }
  // "Given Surname" or institution — last word of chunk.
  const words = firstChunk.split(/\s+/);
  return (words[words.length - 1] || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function titleStem(entry: string): Set<string> {
  // Drop the leading author chunk; tokenize the rest minus stop words.
  const stripped = entry.replace(/\*([^*]+)\*/g, "$1").trim();
  const afterAuthor = stripped.replace(/^[^.,]+[.,]\s*/, "");
  return tokens(afterAuthor);
}

type OrphanFinding = { entry: string; reason: string };
type Match = { entry: string; figIndices: number[]; via: string };

const surviving_bib: string[] = [];
const orphaned: OrphanFinding[] = [];
const matches: Match[] = [];

for (const entry of bibliography) {
  const surname = authorSurname(entry);
  const titleToks = titleStem(entry);
  const entryUrls = urls(entry).map(urlPath);

  const matchingFigIdx: number[] = [];
  let via = "";

  // (a) URL match — strong signal.
  if (entryUrls.length) {
    for (let i = 0; i < surviving.length; i++) {
      const figU = figUrlPaths[i];
      if (!figU) continue;
      if (
        entryUrls.some(
          (eu) => (eu && figU.includes(eu)) || (eu && eu.includes(figU))
        )
      ) {
        matchingFigIdx.push(i);
      }
    }
    if (matchingFigIdx.length) via = "URL match";
  }

  // (b) Author + 2+ distinctive title words appearing in the same figure.
  if (matchingFigIdx.length === 0 && surname) {
    const distinctive = [...titleToks].filter((t) => t.length >= 4).slice(0, 8);
    for (let i = 0; i < surviving.length; i++) {
      const fb = figTokens[i];
      if (!fb.has(surname)) continue;
      const overlap = distinctive.filter((d) => fb.has(d)).length;
      if (overlap >= 2) matchingFigIdx.push(i);
    }
    if (matchingFigIdx.length) via = "author + ≥2 distinctive title words";
  }

  // (c) Last-resort: institutional / pseudonymous entries that don't have
  // a real surname (e.g. "Sfoskett", "Spycatcher58") may not match (a) or
  // (b). Try strict: at least one identifier token + 2 other distinctive
  // tokens shared with one figure's bag.
  if (matchingFigIdx.length === 0) {
    const allDistinctive = [...titleToks].filter((t) => t.length >= 4);
    const idTok = surname && surname.length >= 4 ? surname : "";
    for (let i = 0; i < surviving.length; i++) {
      const fb = figTokens[i];
      const idOK = idTok ? fb.has(idTok) : true;
      if (!idOK) continue;
      const overlap = allDistinctive.filter((d) => fb.has(d)).length;
      if (overlap >= 3) matchingFigIdx.push(i);
    }
    if (matchingFigIdx.length) via = "≥3 distinctive token overlap";
  }

  if (matchingFigIdx.length === 0) {
    orphaned.push({ entry, reason: "no surviving figure references this source" });
  } else {
    surviving_bib.push(entry);
    matches.push({ entry, figIndices: matchingFigIdx, via });
  }
}

// ============================================================
// Pass 2 — dedup remaining
// ============================================================

function dedupKey(entry: string): string {
  const surname = authorSurname(entry);
  const t = [...titleStem(entry)].slice(0, 6).sort().join(" ");
  return `${surname}|${t}`;
}

function hasUrl(entry: string): boolean {
  return /https?:\/\//.test(entry);
}

const groups = new Map<string, string[]>();
for (const e of surviving_bib) {
  const k = dedupKey(e);
  (groups.get(k) ?? groups.set(k, []).get(k)!).push(e);
}

type Removal = { kept: string; dropped: string };
const dedupRemovals: Removal[] = [];
const finalEntries: string[] = [];

for (const [_k, entries] of groups) {
  if (entries.length === 1) {
    finalEntries.push(entries[0]);
    continue;
  }
  let candidates = entries;
  if (candidates.some(hasUrl)) {
    const withUrl = candidates.filter(hasUrl);
    for (const dropped of candidates.filter((e) => !hasUrl(e))) {
      dedupRemovals.push({ kept: withUrl[0], dropped });
    }
    candidates = withUrl;
  }
  candidates.sort((a, b) => b.length - a.length);
  finalEntries.push(candidates[0]);
  for (let i = 1; i < candidates.length; i++) {
    dedupRemovals.push({ kept: candidates[0], dropped: candidates[i] });
  }
}

// Re-alphabetize
function sortKey(entry: string): string {
  const stripped = entry.replace(/\*([^*]+)\*/g, "$1").trim();
  return (stripped.split(/[,.]/)[0] || stripped).toLowerCase();
}
finalEntries.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));

// ============================================================
// Write
// ============================================================

const original = fs.readFileSync(BIB_PATH, "utf8");
fs.writeFileSync(`${BIB_PATH}.backup.${TS}`, original, "utf8");

const header = `// AUTO-GENERATED by _build_nextjs_data.py.
// Bibliography. Cleaned by scripts/cleanup_bibliography.ts: orphan
// entries (no surviving figure cited them) removed, then group dedup
// by (author, title-stem). Re-alphabetized by author surname.

export const bibliography: string[] = [
`;
const body = finalEntries.map((e) => `  ${JSON.stringify(e)},`).join("\n");
fs.writeFileSync(BIB_PATH, `${header}${body}\n];\n`, "utf8");

// ============================================================
// Report
// ============================================================

console.log(`\n=== BIBLIOGRAPHY CLEANUP ===\n`);
console.log(`Before:               ${bibliography.length} entries`);
console.log(`Orphans removed:      ${orphaned.length}`);
console.log(`After orphan pass:    ${surviving_bib.length} entries`);
console.log(`Duplicates removed:   ${dedupRemovals.length}`);
console.log(`Final:                ${finalEntries.length} entries`);
console.log();

if (orphaned.length) {
  console.log(`--- Orphaned entries removed ---`);
  for (const o of orphaned) {
    console.log(`  ${truncate(o.entry, 130)}`);
  }
  console.log();
}

if (dedupRemovals.length) {
  console.log(`--- Duplicates removed in dedup pass ---`);
  for (const r of dedupRemovals) {
    console.log(`  KEPT:    ${truncate(r.kept, 130)}`);
    console.log(`  DROPPED: ${truncate(r.dropped, 130)}`);
    console.log();
  }
}

// Borderline / "almost-orphan" warning: flag entries that were kept but
// only matched via the loose (c) heuristic.
const kindaWeak = matches.filter((m) => m.via === "≥3 distinctive token overlap");
if (kindaWeak.length) {
  console.log(`--- Kept via loose match (review if unsure) ---`);
  for (const m of kindaWeak) {
    console.log(`  ${truncate(m.entry, 130)}`);
    const fig = surviving[m.figIndices[0]];
    console.log(`    closest fig: ${fig?.filename ?? "?"} (${truncate(fig?.caption ?? "", 80)})`);
    console.log();
  }
}

const r = spawnSync("npx", ["tsx", "scripts/build_citations.ts"], { cwd: ROOT, stdio: "inherit", shell: true });
if (r.status !== 0) {
  console.warn(`⚠  CITATIONS.md regen failed (probably open in editor). Run manually after closing.`);
}

console.log(`\nBackup: src/lib/bibliography.ts.backup.${TS}`);

function truncate(s: string, n: number): string {
  const flat = s.replace(/\s+/g, " ");
  return flat.length > n ? flat.slice(0, n) + "…" : flat;
}
