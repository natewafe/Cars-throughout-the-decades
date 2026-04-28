import ExcelJS from "exceljs";
import path from "node:path";

const SRC = "./artifact_workbook_clean_1.xlsx";

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(SRC);
  console.log(`Sheets: ${wb.worksheets.map((w) => w.name).join(" | ")}`);
  for (const ws of wb.worksheets) {
    console.log(`\n=== ${ws.name} (${ws.rowCount} rows) ===`);
    // Print header row
    const header = ws.getRow(1);
    const cells: string[] = [];
    header.eachCell({ includeEmpty: true }, (cell, n) => {
      cells.push(`${n}=${String(cell.value ?? "")}`);
    });
    console.log(`HEADERS: ${cells.join(" | ")}`);
    // Print row 2 to see field shapes
    if (ws.rowCount >= 2) {
      const r = ws.getRow(2);
      const v: string[] = [];
      r.eachCell({ includeEmpty: true }, (c, n) => {
        const s = String(c.value ?? "").replace(/\s+/g, " ").slice(0, 60);
        v.push(`${n}=${s}`);
      });
      console.log(`ROW 2:   ${v.join(" | ")}`);
    }
  }
}
main().catch(console.error);
