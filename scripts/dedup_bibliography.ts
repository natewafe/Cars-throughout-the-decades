/**
 * Aggressive bibliography deduplication — explicit drop list.
 *
 *   Run:  npx tsx scripts/dedup_bibliography.ts
 *
 * The previous heuristic (author-surname + title-fingerprint) collapsed
 * "Cropley, Steve." correctly but failed on institutional names like
 * "Bugatti AG," vs "Bugatti AG." because the punctuation after the
 * institution drove different keying. This version uses an explicit
 * drop list keyed by exact entry text, matching the user's instructions
 * (and a few additional obvious bare/full pairs spotted in passing).
 *
 * After rewriting src/lib/bibliography.ts, this also re-runs
 * CITATIONS.md so the markdown stays in sync.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { bibliography } from "../src/lib/bibliography.js";

const ROOT = process.cwd();
const BIB_PATH = path.resolve(ROOT, "src/lib/bibliography.ts");
const TS = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

/**
 * Bare/inline versions to delete. Each string is matched as a SUBSTRING
 * against the full bibliography entry. The first matching entry per
 * substring is dropped (we never match across multiple entries).
 *
 * Source of truth for which to drop:
 *   - The user's explicit list (Cropley short, Bugatti AG bare, CNN
 *     bare, Porsche AG Gruppe B bare, Sfoskett bare, Gandini bare,
 *     Valder137 bare, Martin Lee Gordon Murray bare).
 *   - Plus obvious bare/full pairs flagged during review (Hamster,
 *     Jay Chelsea, Jesse Alexander, Kimble David, Walter Wolf archive
 *     bare, More Cars bare, Pirelli bare, Dane Poset, Road & Track
 *     bare variants, Rouk40130 bare, Brian Snelson, Alexander Migl,
 *     Uncredited Komfort bare, Scuderi Ferrari bare).
 */
const DROP_SUBSTRINGS: string[] = [
  // Cropley McLaren F1: keep "World's Greatest Supercar" (longer title)
  'Cropley, Steve. "McLaren F1: Full Test." Autocar, May 11, 1994.',

  // Bugatti AG chassis 5.0 — drop the four bare comma-style entries
  'Bugatti AG, Bugatti Veyron Chassis 5.0 Validation Prototype, 2005, press archive via Supercars.net.',
  'Bugatti AG, Bugatti Veyron Chassis 5.0, Ehra-Lessien Era, 2005.',
  'Bugatti AG, Bugatti Veyron Chassis 5.0, Engineering Detail, 2005.',
  'Bugatti AG, Bugatti Veyron Chassis 5.0, Profile, 2005.',

  // CNN Elon Musk — drop two bare versions
  'CNN archival footage, Elon Musk Receives McLaren F1, 1999.',
  'CNN archival footage, Elon Musk Takes Delivery of His McLaren F1, 1999.',

  // Porsche AG Gruppe B — drop the two bare versions
  "Porsche AG, Porsche 'Gruppe B' Concept at 1983 Frankfurt IAA, 1983, press archive via StuttCars.",
  "Porsche AG, Porsche 959 'Gruppe B' Concept, Rothmans Livery, 1983, via StuttCars.",

  // Sfoskett: keep full Chicago with URL
  'Sfoskett, Porsche 959 Engine, 2005, Wikimedia Commons, CC BY-SA 3.0.',

  // Gandini 1976
  'Unknown photographer, Marcello Gandini in 1976, 1976, Wikimedia Commons (Public Domain).',

  // Valder137 Paris-Dakar
  'Valder137, Porsche 959 1986 Paris-Dakar Rothmans Racer, Porsche Museum, 2013, Wikimedia Commons, CC BY 2.0.',

  // Martin Lee — Gordon Murray in the Paddock duplicates "Lee, Martin." version
  'Martin Lee, Gordon Murray in the Paddock at the 1996 Le Mans, 1996, Wikimedia Commons, CC BY-SA 2.0.',

  // ---- Additional obvious bare/full pairs ----
  // Hamster, Dave: full Chicago has URL
  'Dave Hamster, Lamborghini Countach LP500 Prototype, 2016, Wikimedia Commons, CC BY 2.0.',
  // Jay, Chelsea
  'Chelsea Jay, 1995 McLaren F1 LM Engine Bay, 2018, Wikimedia Commons, CC BY-SA 4.0.',
  // Alexander, Jesse: keep "Alexander, Jesse." with URL; drop the "Jesse Alexander," form
  'Jesse Alexander, Nuccio Bertone with the Stratos and Countach, c. 1974, Wikimedia Commons (Public Domain).',
  // Kimble, David: full Chicago has URL via Motorsport.com source
  'David Kimble, Porsche 959 Cutaway Illustration, Motorsport.com, June 8, 2016.',
  // Walter Wolf archive: bare version
  'Lamborghini / Walter Wolf archive, "Walter Wolf with Countach LP400 Speciale," c. 1976, via LamboCars.com.',
  // More Cars (Bugatti Veyron 18.4 Concept)
  'More Cars, Bugatti Veyron 18.4 Concept, 2025, Wikimedia Commons, CC BY 4.0.',
  // Pirelli
  'Pirelli, Countach Top View Poster, April 1986, Wikimedia Commons (Public Domain).',
  // Dane Poset (drop the comma form, keep "Poset, Dane.")
  'Dane Poset, W16 Engine on a Bugatti Veyron Chassis, 2010, Wikimedia Commons, CC BY-SA 3.0.',
  // Road & Track Countach: drop the two bare comma forms; keep the entry that already has full URL
  'Road & Track, "Lamborghini Countach Road Test," Road & Track, February 1976, page 2, scan via Curbside Classic.',
  'Road & Track, "Lamborghini Countach Road Test," Road & Track, February 1976, page scan via Curbside Classic, https://www.curbsideclassic.com/vintage-reviews/road-track-vintage-road-test-1976-lamborghini-countach-fastest-car-weve-ever-tested/.',
  'Road & Track. "Lamborghini Countach Road Test." Road & Track, February 1976.',
  // Rouk40130
  'Rouk40130, Porsche 959 Mechanical Sketch, Porsche Museum Stuttgart, 2024, Wikimedia Commons, CC BY 4.0.',
  // Brian Snelson
  'Brian Snelson, Bugatti Veyron 8.0-litre W16 Engine, 2008, Wikimedia Commons, CC BY 2.0.',
  // Alexander Migl
  'Alexander Migl, Porsche 961 (1987 Le Mans No. 203), Porsche Museum, 2020, Wikimedia Commons, CC BY-SA 4.0.',
  // Uncredited 1988 Porsche 959 Komfort bare
  'Uncredited, 1988 Porsche 959 Komfort, Ralph Lauren Collection, Wikimedia Commons, CC BY-SA 3.0.',
  // Scuderi Ferrari bare (full Chicago covers two distinct angles separately)
  'Scuderi Ferrari, Bugatti EB 18.3 Chiron Concept, 2007, Wikimedia Commons (Public Domain).',
];

// ============================================================
// Apply
// ============================================================

const droppedSet = new Set<string>();
const dropMatched = new Set<string>(); // which patterns actually matched

const kept: string[] = [];
for (const entry of bibliography) {
  let drop = false;
  for (const pattern of DROP_SUBSTRINGS) {
    if (entry === pattern || entry.trim() === pattern.trim()) {
      drop = true;
      dropMatched.add(pattern);
      break;
    }
  }
  if (drop) {
    droppedSet.add(entry);
  } else {
    kept.push(entry);
  }
}

// Re-alphabetize. Surname extraction: first comma OR period chunk,
// take the FIRST WORD (covers "Cropley, Steve" → "Cropley"; institutions
// like "Bugatti AG," → "Bugatti").
function sortKey(entry: string): string {
  const stripped = entry.replace(/\*([^*]+)\*/g, "$1").trim();
  const firstChunk = stripped.split(/[,.]/)[0] || stripped;
  return firstChunk.toLowerCase();
}
kept.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));

// ============================================================
// Write file
// ============================================================

const header = `// AUTO-GENERATED by _build_nextjs_data.py.
// Bibliography, deduplicated by scripts/dedup_bibliography.ts and
// re-alphabetized by author surname. Re-running the Python build will
// regenerate from scratch and wipe these dedup edits.

export const bibliography: string[] = [
`;
const body = kept.map((e) => `  ${JSON.stringify(e)},`).join("\n");
const out = `${header}${body}\n];\n`;

const original = fs.readFileSync(BIB_PATH, "utf8");
fs.writeFileSync(`${BIB_PATH}.backup.${TS}`, original, "utf8");
fs.writeFileSync(BIB_PATH, out, "utf8");

// ============================================================
// Report + regen CITATIONS.md (best-effort)
// ============================================================

console.log(`\n=== BIBLIOGRAPHY DEDUP ===\n`);
console.log(`Before:  ${bibliography.length} entries`);
console.log(`After:   ${kept.length} entries`);
console.log(`Removed: ${droppedSet.size} entries`);
console.log();

const unmatched = DROP_SUBSTRINGS.filter((p) => !dropMatched.has(p));
if (unmatched.length) {
  console.log(`⚠  ${unmatched.length} drop pattern(s) did not match any entry:`);
  for (const u of unmatched) console.log(`    ${truncate(u, 110)}`);
  console.log();
}

if (droppedSet.size) {
  console.log(`--- Dropped entries ---`);
  for (const d of droppedSet) console.log(`  ${truncate(d, 130)}`);
  console.log();
}

const citeResult = spawnSync("npx", ["tsx", "scripts/build_citations.ts"], {
  cwd: ROOT,
  stdio: "inherit",
  shell: true,
});
if (citeResult.status !== 0) {
  console.warn(`⚠  CITATIONS.md regeneration failed (close it if it's open in an editor, then run: npx tsx scripts/build_citations.ts)`);
}

console.log(`\nBackup: src/lib/bibliography.ts.backup.${TS}`);

function truncate(s: string, n: number): string {
  const flat = s.replace(/\s+/g, " ");
  return flat.length > n ? flat.slice(0, n) + "…" : flat;
}
