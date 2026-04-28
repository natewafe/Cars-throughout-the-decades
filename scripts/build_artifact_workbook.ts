/**
 * Build an .xlsx workbook with one tab per car. Each row is a figure or
 * one page of a carousel:
 *   FIG | FILENAME | SECTION | CITATION | URL | LICENSE | IMAGE | MY BLURB
 *
 *   Run:  npx tsx scripts/build_artifact_workbook.ts
 *   Out:  artifact_workbook.xlsx
 *
 * Carousel rows are grouped together visually with a "(N of M)" prefix
 * on the SECTION column so all pages of one source sit next to each
 * other when sorting.
 */

import ExcelJS from "exceljs";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { artifactsBySlug } from "../src/lib/artifacts.js";
import { bibliography } from "../src/lib/bibliography.js";

const ROOT = process.cwd();
const OUT = path.resolve(ROOT, "artifact_workbook.xlsx");
const PUB = path.resolve(ROOT, "public/artifacts");

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

const HEADER_FILL = "FF1A1A1A";
const HEADER_FONT = "FFFFFFFF";
const BLURB_FILL = "FFFFFACD";
const FEATURED_FILL = "FFFFF4CC";
const CAROUSEL_FILL = "FFEDF2FA";

const IMG_PIXEL_HEIGHT = 180;
const ROW_HEIGHT_PT = 140;
const IMAGE_COL_WIDTH = 32;

async function main() {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Motor Gallery artifact workbook";
  wb.created = new Date();

  let totalRows = 0;
  let embedded = 0;
  const failures: string[] = [];

  for (const slug of SLUG_ORDER) {
    const data = artifactsBySlug[slug];
    if (!data) continue;
    const display = SLUG_DISPLAY[slug];
    const dirName = IMG_DIR[slug] ?? data.imgDir ?? slug;

    const ws = wb.addWorksheet(display, {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    ws.columns = [
      { header: "ID",        key: "id",       width: 28 },
      { header: "FILENAME",  key: "filename", width: 40 },
      { header: "SECTION",   key: "section",  width: 36 },
      { header: "CITATION",  key: "citation", width: 60 },
      { header: "URL",       key: "url",      width: 50 },
      { header: "LICENSE",   key: "license",  width: 26 },
      { header: "FEATURED",  key: "featured", width: 10 },
      { header: "IMAGE",     key: "image",    width: IMAGE_COL_WIDTH },
      { header: "MY BLURB",  key: "blurb",    width: 50 },
    ];

    const headerRow = ws.getRow(1);
    headerRow.height = 22;
    headerRow.font = { bold: true, color: { argb: HEADER_FONT }, size: 11 };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    headerRow.alignment = { vertical: "middle", horizontal: "left" };

    for (const item of data.artifacts) {
      if (item.kind === "figure") {
        await addImageRow(ws, dirName, {
          id: item.id,
          filename: item.filename,
          section: item.section,
          citation: item.citation,
          url: item.url,
          license: item.license,
          featured: item.featured,
          blurb: item.blurb,
          isCarouselPage: false,
        });
        totalRows++;
      } else {
        // One row per carousel page. Decorate section with the title
        // + page index so the workbook keeps the group readable.
        const pages = item.pages;
        for (let i = 0; i < pages.length; i++) {
          const p = pages[i];
          await addImageRow(ws, dirName, {
            id: `${item.id}#${i + 1}`,
            filename: p.filename,
            section: `${item.section} — ${item.title} (${i + 1}/${pages.length})`,
            citation: i === 0 ? item.citation : p.caption,
            url: "",
            license: "",
            featured: item.featured,
            blurb: i === 0 ? item.blurb : "",
            isCarouselPage: true,
          });
          totalRows++;
        }
      }
    }

    async function addImageRow(
      ws: ExcelJS.Worksheet,
      dirName: string,
      r: {
        id: string;
        filename: string;
        section: string;
        citation: string;
        url: string;
        license: string;
        featured: boolean;
        blurb: string;
        isCarouselPage: boolean;
      }
    ) {
      const row = ws.addRow({
        id: r.id,
        filename: r.filename,
        section: r.section,
        citation: r.citation,
        url: r.url,
        license: r.license,
        featured: r.featured ? "yes" : "",
        image: "",
        blurb: r.blurb,
      });
      row.height = ROW_HEIGHT_PT;
      row.alignment = { vertical: "top", wrapText: true };
      row.getCell("blurb").fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: BLURB_FILL },
      };
      if (r.featured) {
        row.getCell("featured").fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: FEATURED_FILL },
        };
      }
      if (r.isCarouselPage) {
        row.getCell("section").fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: CAROUSEL_FILL },
        };
      }

      const src = path.join(PUB, dirName, r.filename);
      if (!fs.existsSync(src)) {
        failures.push(`${dirName}/${r.filename} (file missing)`);
        return;
      }
      try {
        const png = await sharp(src)
          .resize({ width: 600, height: 600, fit: "inside" })
          .png({ quality: 80, compressionLevel: 8 })
          .toBuffer();
        const meta = await sharp(png).metadata();
        const aspect = (meta.width ?? 600) / (meta.height ?? 400);
        const renderHeight = IMG_PIXEL_HEIGHT;
        const renderWidth = Math.round(renderHeight * aspect);
        const imageId = wb.addImage({ buffer: png, extension: "png" });
        ws.addImage(imageId, {
          tl: { col: 7.05, row: row.number - 1 + 0.05 },
          ext: { width: renderWidth, height: renderHeight },
          editAs: "oneCell",
        });
        embedded++;
      } catch (err) {
        failures.push(`${dirName}/${r.filename} (${(err as Error).message})`);
      }
    }
  }

  // ============ Bibliography sheet ============
  const bib = wb.addWorksheet("Bibliography", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  bib.columns = [
    { header: "#", key: "n", width: 5 },
    { header: "ENTRY", key: "entry", width: 130 },
  ];
  const bibHeader = bib.getRow(1);
  bibHeader.height = 22;
  bibHeader.font = { bold: true, color: { argb: HEADER_FONT }, size: 11 };
  bibHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
  bibHeader.alignment = { vertical: "middle", horizontal: "left" };
  bibliography.forEach((entry, i) => {
    const r = bib.addRow({ n: i + 1, entry });
    r.alignment = { vertical: "top", wrapText: true };
    r.height = Math.max(20, Math.min(80, Math.ceil(entry.length / 95) * 16));
  });

  await wb.xlsx.writeFile(OUT);

  console.log(`✓ Wrote ${path.relative(ROOT, OUT)}`);
  console.log(`  Bibliography entries: ${bibliography.length}`);
  console.log(`  Total rows across car sheets: ${totalRows}`);
  console.log(`  Images embedded: ${embedded}`);
  if (failures.length) {
    console.log(`\n⚠ ${failures.length} image(s) failed:`);
    for (const f of failures) console.log(`    ${f}`);
  }
}

main().catch((err) => {
  console.error("Workbook build failed:", err);
  process.exit(1);
});
