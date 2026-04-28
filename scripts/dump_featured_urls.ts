/**
 * Print every featured artifact (across all 4 cars) with its source URL,
 * organized: car → description → URL. Pulls URL from the workbook
 * (carousels don't carry per-page URLs in artifacts.ts, but every
 * workbook row does).
 *
 *   Run:  npx tsx scripts/dump_featured_urls.ts
 */

import ExcelJS from "exceljs";
import { artifactsBySlug } from "../src/lib/artifacts.js";

const SRC = "./artifact_workbook_clean_1.xlsx";

const SHEET_TO_SLUG: Record<string, string> = {
  "McLaren F1": "f1",
  "Porsche 959": "959",
  "Lamborghini Countach": "countach",
  "Bugatti Veyron": "veyron",
};
const SLUG_DISPLAY: Record<string, string> = {
  f1: "McLaren F1",
  "959": "Porsche 959",
  countach: "Lamborghini Countach",
  veyron: "Bugatti Veyron",
};
const ORDER = ["f1", "959", "countach", "veyron"];

function cellStr(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "object" && v !== null && "text" in (v as Record<string, unknown>))
    return String((v as { text: unknown }).text ?? "");
  if (typeof v === "object" && v !== null && "richText" in (v as Record<string, unknown>))
    return ((v as { richText: { text: string }[] }).richText.map((p) => p.text).join(""));
  if (typeof v === "object" && v !== null && "hyperlink" in (v as Record<string, unknown>))
    return String((v as { hyperlink: unknown }).hyperlink ?? "");
  return String(v);
}

async function main() {
  // Build filename → url map from workbook.
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(SRC);
  const fileUrl = new Map<string, { url: string; citation: string }>();
  for (const ws of wb.worksheets) {
    if (!SHEET_TO_SLUG[ws.name]) continue;
    ws.eachRow({ includeEmpty: false }, (row, n) => {
      if (n === 1) return;
      const filename = cellStr(row.getCell(2).value).trim();
      if (!filename || filename.startsWith("⚠")) return;
      fileUrl.set(filename, {
        url: cellStr(row.getCell(5).value).trim(),
        citation: cellStr(row.getCell(4).value).trim(),
      });
    });
  }

  for (const slug of ORDER) {
    const data = artifactsBySlug[slug];
    if (!data) continue;
    console.log(`\n## ${SLUG_DISPLAY[slug]}\n`);
    for (const item of data.artifacts) {
      if (!item.featured) continue;
      if (item.kind === "figure") {
        const fb = fileUrl.get(item.filename);
        const url = item.url || fb?.url || "—";
        console.log(`- ${item.citation}`);
        console.log(`  ${url}`);
      } else {
        console.log(`### ${item.title} (${item.pages.length} pages)`);
        for (let i = 0; i < item.pages.length; i++) {
          const p = item.pages[i];
          const fb = fileUrl.get(p.filename);
          const url = fb?.url || "—";
          // Caption already says "Page N of M — citation"; print that + URL.
          console.log(`- Page ${i + 1}: ${(fb?.citation ?? p.caption)}`);
          console.log(`  ${url}`);
        }
      }
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
