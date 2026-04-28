import ExcelJS from "exceljs";

async function main() {
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile("./artifact_workbook_clean_1.xlsx");

function val(c: ExcelJS.Cell): string {
  const v = c.value as unknown;
  if (v == null) return "";
  if (typeof v === "object" && v !== null && "text" in (v as Record<string, unknown>))
    return String((v as { text: unknown }).text ?? "");
  if (typeof v === "object" && v !== null && "richText" in (v as Record<string, unknown>))
    return ((v as { richText: { text: string }[] }).richText.map((p) => p.text).join(""));
  return String(v);
}

for (const ws of wb.worksheets) {
  if (!["McLaren F1","Porsche 959","Lamborghini Countach","Bugatti Veyron"].includes(ws.name)) continue;
  ws.eachRow({ includeEmpty: false }, (row, n) => {
    if (n === 1) return;
    const fname = val(row.getCell(2));
    {
      console.log(`[${ws.name} row ${n}] ${fname} | group=${val(row.getCell(7))} | feat=${val(row.getCell(8))}`);
    }
    if (false) {
      console.log(`[${ws.name} row ${n}]`);
      console.log(`  FIG:      ${val(row.getCell(1))}`);
      console.log(`  FILENAME: ${fname}`);
      console.log(`  SECTION:  ${val(row.getCell(3))}`);
      console.log(`  CITATION: ${val(row.getCell(4)).slice(0, 120)}`);
      console.log(`  URL:      ${val(row.getCell(5)).slice(0, 120)}`);
      console.log(`  GROUP:    ${val(row.getCell(7))}`);
      console.log(`  BLURB:    ${val(row.getCell(9)).slice(0, 200)}`);
      console.log();
    }
  });
}
}
main();
