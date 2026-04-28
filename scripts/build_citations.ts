/**
 * Generate CITATIONS.md at the project root.
 *
 *   Run:  npx tsx scripts/build_citations.ts
 *
 * Pulls from src/lib/artifacts.ts (figures + carousels) and
 * src/lib/bibliography.ts (alphabetized list).
 */

import fs from "node:fs";
import path from "node:path";
import {
  artifactsBySlug,
  type ArtifactItem,
} from "../src/lib/artifacts.js";
import { bibliography } from "../src/lib/bibliography.js";
import { cars } from "../src/lib/cars.js";

const OUT = path.resolve(process.cwd(), "CITATIONS.md");

function escapePipe(s: string): string {
  return (s || "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}
function urlCell(url: string): string {
  if (!url) return "—";
  return `[link](${url})`;
}

const SLUG_DISPLAY: Record<string, string> = {
  countach: "Lamborghini Countach",
  "959": "Porsche 959",
  f1: "McLaren F1",
  veyron: "Bugatti Veyron",
};
const SLUG_ORDER = ["f1", "959", "countach", "veyron"];

const lines: string[] = [];
lines.push("# Citations reference");
lines.push("");
lines.push(
  "Generated from `src/lib/artifacts.ts` and `src/lib/bibliography.ts` via `scripts/build_citations.ts`. Re-run the script anytime data changes."
);
lines.push("");

let totalFigs = 0;
let totalCarousels = 0;
for (const slug of SLUG_ORDER) {
  const data = artifactsBySlug[slug];
  if (!data) continue;
  const display = SLUG_DISPLAY[slug] ?? slug;
  const car = cars.find((c) => c.slug === slug);

  lines.push(`## ${display}`);
  lines.push("");
  lines.push("**Primary source**");
  lines.push("");
  lines.push(`- ${data.primarySource.citation || "—"}`);
  if (car?.modelUrl) lines.push(`- _3D model:_ ${car.modelUrl}`);
  lines.push("");

  // Group artifacts by section for readability.
  const bySection = new Map<string, ArtifactItem[]>();
  for (const it of data.artifacts) {
    (bySection.get(it.section) ?? bySection.set(it.section, []).get(it.section)!).push(it);
  }

  for (const [section, items] of bySection) {
    lines.push(`### ${section}`);
    lines.push("");
    lines.push("| ID | Filename(s) | Citation | URL | Featured |");
    lines.push("|----|-------------|----------|-----|----------|");
    for (const it of items) {
      if (it.kind === "figure") {
        totalFigs++;
        lines.push(
          `| ${it.id} | \`${it.filename}\` | ${escapePipe(it.citation)} | ${urlCell(it.url)} | ${it.featured ? "★" : ""} |`
        );
      } else {
        totalCarousels++;
        const filenames = it.pages.map((p) => `\`${p.filename}\``).join("<br>");
        lines.push(
          `| ${it.id} | ${filenames}<br>(${it.pages.length}-page carousel) | ${escapePipe(it.citation)} | — | ${it.featured ? "★" : ""} |`
        );
      }
    }
    lines.push("");
  }

  lines.push("");
}

lines.push("## Full bibliography (deduplicated, alphabetical, Chicago style)");
lines.push("");
bibliography.forEach((entry, i) => lines.push(`${i + 1}. ${entry}`));
lines.push("");

fs.writeFileSync(OUT, lines.join("\n"), "utf8");

console.log(`✓ Wrote ${OUT}`);
console.log(`  Cars: ${SLUG_ORDER.length}`);
console.log(`  Figures: ${totalFigs}, Carousels: ${totalCarousels}`);
console.log(`  Bibliography: ${bibliography.length}`);
