/**
 * Generate artifact_notes.md AND copy every figure/carousel page image
 * into a sequentially-numbered review folder so they sort visually in
 * order.
 *
 *   Run:  npx tsx scripts/build_artifact_notes.ts
 *
 * Outputs:
 *   - artifact_notes.md            (one block per item)
 *   - public/artifact-review/<car>/  (numbered copies of every image)
 */

import fs from "node:fs";
import path from "node:path";
import { artifactsBySlug } from "../src/lib/artifacts.js";

const ROOT = process.cwd();
const NOTES_OUT = path.resolve(ROOT, "artifact_notes.md");
const PUB_ARTIFACTS = path.resolve(ROOT, "public/artifacts");
const PUB_REVIEW = path.resolve(ROOT, "public/artifact-review");

const SLUG_DISPLAY: Record<string, string> = {
  countach: "Lamborghini Countach",
  "959": "Porsche 959",
  f1: "McLaren F1",
  veyron: "Bugatti Veyron",
};
const SLUG_ORDER = ["f1", "959", "countach", "veyron"];
const IMG_DIR: Record<string, string> = {
  countach: "countach",
  "959": "porsche-959",
  f1: "mclaren-f1",
  veyron: "veyron",
};

if (fs.existsSync(PUB_REVIEW)) fs.rmSync(PUB_REVIEW, { recursive: true, force: true });
fs.mkdirSync(PUB_REVIEW, { recursive: true });

const lines: string[] = [];
lines.push("# Artifact notes — all figures, editable");
lines.push("");
lines.push(
  "One block per artifact. Carousels list every page filename. Each image is also copied into `public/artifact-review/<car>/` numbered in order."
);
lines.push("");

let totalItems = 0;
let totalImages = 0;
const failures: string[] = [];

for (const slug of SLUG_ORDER) {
  const data = artifactsBySlug[slug];
  if (!data) continue;
  const display = SLUG_DISPLAY[slug];
  const imgDirName = IMG_DIR[slug] ?? data.imgDir ?? slug;
  const reviewDir = path.join(PUB_REVIEW, imgDirName);
  fs.mkdirSync(reviewDir, { recursive: true });

  lines.push(`# ${display}`);
  lines.push("");

  let idx = 0;
  for (const item of data.artifacts) {
    idx++;
    totalItems++;
    const padded = String(idx).padStart(2, "0");

    if (item.kind === "figure") {
      lines.push("---");
      lines.push(`PAGE: ${display}`);
      lines.push(`SECTION: ${item.section}`);
      lines.push(`KIND: figure`);
      lines.push(`ID: ${item.id}`);
      lines.push(`FILENAME: ${item.filename}`);
      lines.push(`CITATION: ${item.citation || "—"}`);
      lines.push(`URL: ${item.url || "—"}`);
      lines.push(`LICENSE: ${item.license || "—"}`);
      lines.push(`FEATURED: ${item.featured ? "yes" : "no"}`);
      lines.push("");
      lines.push("MY BLURB:");
      lines.push(item.blurb || "[write here]");
      lines.push("");
      lines.push("CITATION CHECK: ☐");
      lines.push("---");
      lines.push("");

      const src = path.join(PUB_ARTIFACTS, imgDirName, item.filename);
      const dst = path.join(reviewDir, `${padded}-${item.filename}`);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dst);
        totalImages++;
      } else {
        failures.push(`${imgDirName}/${item.filename}`);
      }
    } else {
      lines.push("---");
      lines.push(`PAGE: ${display}`);
      lines.push(`SECTION: ${item.section}`);
      lines.push(`KIND: carousel (${item.pages.length} pages)`);
      lines.push(`ID: ${item.id}`);
      lines.push(`TITLE: ${item.title}`);
      lines.push(`CITATION: ${item.citation || "—"}`);
      lines.push(`FEATURED: ${item.featured ? "yes" : "no"}`);
      lines.push("");
      lines.push("PAGES:");
      item.pages.forEach((p, i) => lines.push(`  ${i + 1}. ${p.filename}`));
      lines.push("");
      lines.push("MY BLURB:");
      lines.push(item.blurb || "[write here]");
      lines.push("");
      lines.push("CITATION CHECK: ☐");
      lines.push("---");
      lines.push("");

      // Copy every page image — filenames embed the carousel index +
      // its page number so they group together in order.
      item.pages.forEach((p, i) => {
        const src = path.join(PUB_ARTIFACTS, imgDirName, p.filename);
        const dst = path.join(
          reviewDir,
          `${padded}-${String(i + 1).padStart(2, "0")}-${p.filename}`
        );
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dst);
          totalImages++;
        } else {
          failures.push(`${imgDirName}/${p.filename}`);
        }
      });
    }
  }
}

fs.writeFileSync(NOTES_OUT, lines.join("\n"), "utf8");

console.log(`✓ Wrote ${path.relative(ROOT, NOTES_OUT)}`);
console.log(`  Items written: ${totalItems}`);
console.log(`  Images copied: ${totalImages}`);
if (failures.length) {
  console.log(`\n⚠ ${failures.length} image(s) missing on disk:`);
  for (const f of failures) console.log(`  ${f}`);
}
