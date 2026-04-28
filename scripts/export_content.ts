/**
 * Generate site_content.xlsx from the content registry.
 *
 *   Run:   npx tsx scripts/export_content.ts
 *   Out:   ./site_content.xlsx
 */

import ExcelJS from "exceljs";
import path from "node:path";
import { buildAllRows, SHEET_ORDER, type ContentRow } from "./content-registry.js";

const OUT_PATH = path.resolve(process.cwd(), "site_content.xlsx");

const HEADER_FILL = "FF1A1A1A";        // dark grey/black
const HEADER_FONT_COLOR = "FFFFFFFF";  // white
const PAGE_GROUP_FILL = "FFEEEEEE";    // light grey alternation
const NEW_VALUE_FILL = "FFFFFACD";     // bright yellow

async function main() {
  const rows = buildAllRows();
  const grouped: Record<string, ContentRow[]> = {};
  for (const r of rows) {
    (grouped[r.sheet] ??= []).push(r);
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = "Motor Gallery content export";
  wb.created = new Date();

  for (const sheetName of SHEET_ORDER) {
    const sheetRows = grouped[sheetName] ?? [];
    if (!sheetRows.length) continue;
    const ws = wb.addWorksheet(sheetName, {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    // Header row
    ws.columns = [
      { header: "PAGE",          key: "page",  width: 22 },
      { header: "FIELD",         key: "field", width: 30 },
      { header: "CURRENT VALUE", key: "value", width: 80 },
      { header: "NEW VALUE",     key: "new",   width: 60 },
    ];
    const header = ws.getRow(1);
    header.height = 22;
    header.font = { bold: true, color: { argb: HEADER_FONT_COLOR }, size: 11 };
    header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    header.alignment = { vertical: "middle", horizontal: "left" };

    // Data rows
    let lastPage: string | null = null;
    let alternate = false;
    for (const r of sheetRows) {
      if (r.page !== lastPage) {
        alternate = !alternate;
        lastPage = r.page;
      }
      const row = ws.addRow({
        page: r.page,
        field: r.field,
        value: r.value,
        new: "",
      });

      // Wrap text + light vertical padding everywhere.
      row.alignment = { vertical: "top", wrapText: true };

      // Light grey alternating fill on Column A only (group separator).
      if (alternate) {
        row.getCell("page").fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: PAGE_GROUP_FILL },
        };
      }

      // Bright yellow on Column D (NEW VALUE) — where the user types edits.
      row.getCell("new").fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: NEW_VALUE_FILL },
      };

      // Hint estimated row height from value length.
      const lines = r.value.split("\n").length;
      const longestLine = r.value.split("\n").reduce((m, l) => Math.max(m, l.length), 0);
      const wrapped = Math.ceil(longestLine / 80);
      row.height = Math.max(18, Math.min(120, (lines + wrapped) * 14));
    }
  }

  await wb.xlsx.writeFile(OUT_PATH);
  console.log(`✓ Wrote ${OUT_PATH}`);
  console.log(`  Sheets:`);
  for (const sheet of SHEET_ORDER) {
    const count = grouped[sheet]?.length ?? 0;
    if (count > 0) console.log(`    ${sheet.padEnd(14)} ${count} rows`);
  }
}

main().catch((err) => {
  console.error("Export failed:", err);
  process.exit(1);
});
