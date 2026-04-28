/**
 * Read bibliography.docx (at the project root), extract every entry,
 * and write src/lib/bibliography.ts. Entries are kept in the order
 * the document gives them (the user already alphabetized them by hand).
 *
 *   Run:  npx tsx scripts/import_docx_bibliography.ts
 */

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "bibliography.docx");
const DST = path.join(ROOT, "src/lib/bibliography.ts");

function readDocxEntry(buf: Buffer, name: string): Buffer | null {
  let i = 0;
  while (i < buf.length - 30) {
    if (buf.readUInt32LE(i) === 0x04034b50) {
      const fnLen = buf.readUInt16LE(i + 26);
      const exLen = buf.readUInt16LE(i + 28);
      const fn = buf.slice(i + 30, i + 30 + fnLen).toString("utf8");
      const compMethod = buf.readUInt16LE(i + 8);
      const compSize = buf.readUInt32LE(i + 18);
      const dataStart = i + 30 + fnLen + exLen;
      if (fn === name) {
        const data = buf.slice(dataStart, dataStart + compSize);
        return compMethod === 8 ? zlib.inflateRawSync(data) : data;
      }
      i = dataStart + compSize;
    } else {
      i++;
    }
  }
  return null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)));
}

const buf = fs.readFileSync(SRC);
const xmlBuf = readDocxEntry(buf, "word/document.xml");
if (!xmlBuf) {
  console.error("word/document.xml not found in docx.");
  process.exit(1);
}
const xml = xmlBuf.toString("utf8");

// Extract one paragraph per <w:p>. Within each paragraph, walk every
// <w:r> (run): if its <w:rPr> contains <w:i/>, the text inside is
// italic, so wrap it with *...* markdown so the renderer's fmtBib can
// turn it into <em>. Hyperlinks (<w:hyperlink>) are also preserved by
// keeping their inner runs intact — fmtBib autolinks any http(s)://.
const paragraphs: string[] = [];
const pRe = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g;
let m: RegExpExecArray | null;
while ((m = pRe.exec(xml))) {
  const inner = m[1];
  // Walk runs in document order. <w:r> blocks may live inside
  // <w:hyperlink> too; both contain <w:t> and optional <w:rPr><w:i/>.
  const runRe = /<w:r\b[^>]*>([\s\S]*?)<\/w:r>/g;
  let runMatch: RegExpExecArray | null;
  let para = "";
  while ((runMatch = runRe.exec(inner))) {
    const runXml = runMatch[1];
    const isItalic = /<w:rPr>[\s\S]*?<w:i\s*\/>[\s\S]*?<\/w:rPr>/.test(runXml);
    const txt = [...runXml.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)]
      .map((t) => t[1])
      .join("");
    if (!txt) continue;
    para += isItalic ? `*${txt}*` : txt;
  }
  const decoded = decodeEntities(para).trim();
  if (decoded) paragraphs.push(decoded);
}

// Collapse adjacent same-marker italics: "*Foo* *Bar*" → "*Foo Bar*".
// Word splits italic spans whenever any rPr changes; without this collapse
// the markdown gets noisy.
function collapseAdjacent(s: string): string {
  return s
    .replace(/\*\s*\*/g, " ") // empty pair
    .replace(/\*([^*]+)\*\s*\*([^*]+)\*/g, "*$1 $2*");
}

// Drop heading + description (first two non-empty paragraphs); the rest
// are entries.
const title = paragraphs[0] ?? "";
const desc = paragraphs[1] ?? "";
let entries = paragraphs.slice(2);

// Defensive: skip any line that's still clearly not an entry (no period).
entries = entries.filter((e) => e.length > 10).map(collapseAdjacent);

// Build the new bibliography.ts.
const header = `// Imported from bibliography.docx via scripts/import_docx_bibliography.ts.
// Hand-authored Chicago-style bibliography. Re-run the script after
// editing the .docx to regenerate. Do NOT have the workbook apply
// pipeline overwrite this file.
//
// Source title:       ${title}
// Source description: ${desc}

export const bibliography: string[] = [
`;
const body = entries.map((e) => `  ${JSON.stringify(e)},`).join("\n");
fs.writeFileSync(DST, `${header}${body}\n];\n`, "utf8");

console.log(`✓ Wrote ${path.relative(ROOT, DST)}`);
console.log(`  Entries: ${entries.length}`);
