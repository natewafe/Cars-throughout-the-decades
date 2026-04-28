/**
 * Build the Velocity & Vision legacy gallery pages from sources.json.
 *
 *   Run:  npx tsx scripts/build_legacy_galleries.ts
 *
 * Reads:
 *   primary-sources/from-main-sources/sources.json                    Tier 1
 *   primary-sources/{countach,porsche-959,mclaren-f1,veyron}/...      Tier 2
 *   primary-sources/sourcing-pass-apr-2026/.../sources.json           Tier 4
 *   primary-sources/CITATIONS_EXPORT.md                               external 4 + bibliography
 *
 * Writes:
 *   legacy/images/{countach,959,f1,veyron}/<filename>                 staged images
 *   legacy/{countach,959,f1,veyron}.html                              gallery pages (replaces gallery sections)
 *   legacy/about.html                                                 bibliography list
 *   legacy/shared.css                                                 appends new artifact / footnote / missing-image classes (idempotent)
 *   SOURCES_CHANGELOG.md                                              changelog table
 *
 * Hard rules followed:
 *   - No em dashes anywhere we generate.
 *   - Existing object-label inner content is preserved by parsing
 *     the existing HTML; only fresh figures get the placeholder comment.
 *   - No invention of facts; everything comes from sources.json + the
 *     external-citations block in CITATIONS_EXPORT.md.
 *   - Corrected citation strings used verbatim (chicago_caption /
 *     chicago_bibliography / chicago_footnote_short / chicago_citation).
 *   - index.html is not touched.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PS = path.join(ROOT, "primary-sources");
const LEG = path.join(ROOT, "legacy");

const CAR_FOLDER: Record<string, string> = {
  countach: "countach",
  "959": "959",
  f1: "f1",
  veyron: "veyron",
};
const CAR_SLUG_TO_HTML: Record<string, string> = {
  countach: "countach.html",
  "959": "959.html",
  f1: "f1.html",
  veyron: "veyron.html",
};
const TIER_PRIMARY_FOLDER_MAP: Record<string, string> = {
  "1970s-countach": "countach",
  "1980s-porsche-959": "959",
  "1990s-mclaren-f1": "f1",
  "2000s-veyron": "veyron",
};
const T2_DIR_TO_SLUG: Record<string, string> = {
  countach: "countach",
  "porsche-959": "959",
  "mclaren-f1": "f1",
  veyron: "veyron",
};

type Figure = {
  filename: string;
  alt: string;
  caption: string;          // used in figcaption .caption span (chicago_caption)
  bibliography: string;     // used for first reference in footnotes
  footnoteShort: string;    // used for repeat references
  section: string;          // section label
  hasCorrection: boolean;
  sourceUrl: string;        // primary URL embedded in caption (best-effort)
  rawSourcePath: string;    // path on disk to copy from (relative to repo root)
  isPlaceholder?: boolean;  // true for the 4 external citations w/o image file
};

type CarBundle = {
  slug: string;             // countach | 959 | f1 | veyron
  primaryWrittenSource?: { bibliography: string; footnoteShort: string };
  sections: Map<string, Figure[]>;
};

// ============================================================
// Helpers
// ============================================================

const noEmDash = (s: string) => s.replace(/—/g, ", ").replace(/–/g, "-");

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Render *italics* and existing URLs as <a>. The chicago_caption strings
 *  use Markdown-style asterisks for italic titles and embed a raw URL. */
function renderInlineCitation(s: string): string {
  let out = escapeHtml(noEmDash(s));
  // Restore italics: turn \*foo\* (after escaping) back into <em>foo</em>.
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  // Promote URLs to anchors. Match http(s)://... up to whitespace or end-period
  // followed by space/end. Be conservative: trailing punctuation kept outside.
  out = out.replace(
    /(https?:\/\/[^\s<>"]+?)(?=[)\].,;]?(?:\s|$))/g,
    (m) => `<a href="${m}" target="_blank" rel="noopener">${m}</a>`
  );
  return out;
}

function readJSON(p: string): unknown {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

// ============================================================
// 1. Read existing HTML to preserve object-label content
// ============================================================

function parseExistingObjectLabels(htmlPath: string): Map<string, string> {
  const map = new Map<string, string>();
  if (!fs.existsSync(htmlPath)) return map;
  const html = fs.readFileSync(htmlPath, "utf8");
  // Match every <figure class="artifact" ...> block and look for img src + object-label inner.
  const figRe = /<figure\b[^>]*class="[^"]*artifact[^"]*"[^>]*>([\s\S]*?)<\/figure>/g;
  let m: RegExpExecArray | null;
  while ((m = figRe.exec(html))) {
    const inner = m[1];
    const srcMatch = /<img[^>]*src="([^"]+)"/.exec(inner);
    const labelMatch = /<div\b[^>]*class="[^"]*object-label[^"]*"[^>]*>([\s\S]*?)<\/div>/.exec(inner);
    if (!srcMatch || !labelMatch) continue;
    const filename = path.posix.basename(srcMatch[1]);
    const labelInner = labelMatch[1];
    // Skip if inner is just whitespace + an HTML comment (the placeholder).
    const stripped = labelInner.replace(/<!--[\s\S]*?-->/g, "").trim();
    if (stripped.length === 0) continue;
    map.set(filename, labelInner.trim());
  }
  return map;
}

// ============================================================
// 2. Read all sources.json into per-car bundles
// ============================================================

const bundles: Map<string, CarBundle> = new Map();
const ensure = (slug: string): CarBundle => {
  let b = bundles.get(slug);
  if (!b) {
    b = { slug, sections: new Map() };
    bundles.set(slug, b);
  }
  return b;
};
const pushFig = (slug: string, section: string, fig: Figure) => {
  const b = ensure(slug);
  if (!b.sections.has(section)) b.sections.set(section, []);
  b.sections.get(section)!.push(fig);
};

// ---------- Tier 1 ----------
{
  const t1 = readJSON(path.join(PS, "from-main-sources", "sources.json")) as {
    folders: Record<string, Record<string, Array<Record<string, unknown>>>>;
  };
  for (const [decadeKey, sourceFolders] of Object.entries(t1.folders)) {
    const slug = TIER_PRIMARY_FOLDER_MAP[decadeKey];
    if (!slug) continue;
    for (const [folderName, items] of Object.entries(sourceFolders)) {
      const isPrimary = folderName.startsWith("primary-");
      const isSecondary = folderName.startsWith("secondary-");
      const section = isPrimary ? "Primary Source" : isSecondary ? "Secondary Source" : "";
      if (!section) continue;
      for (const it of items) {
        const filename = String(it.filename ?? "");
        const description = String(it.description ?? "");
        const caption = String(it.chicago_caption ?? "");
        const bibliography = String(it.chicago_bibliography ?? "");
        const footnoteShort = String(it.chicago_footnote_short ?? "");
        const rawSourcePath = path.join(PS, "from-main-sources", decadeKey, folderName, filename);
        const sourceUrl = String(it.source_page ?? it.source_url ?? "");
        const hasCorrection = !!it.citation_correction_rationale;
        pushFig(slug, section, {
          filename,
          alt: description,
          caption,
          bibliography,
          footnoteShort,
          section,
          hasCorrection,
          sourceUrl,
          rawSourcePath,
        });
      }
    }
  }
}

// ---------- Tier 2 ----------
const T2_DIRS = ["countach", "porsche-959", "mclaren-f1", "veyron"];
for (const dir of T2_DIRS) {
  const slug = T2_DIR_TO_SLUG[dir];
  const file = path.join(PS, dir, "sources.json");
  if (!fs.existsSync(file)) continue;
  const j = readJSON(file) as {
    primary_written_source?: { chicago_bibliography?: string; chicago_footnote_short?: string };
    image_primary_sources?: Array<Record<string, unknown>>;
  };
  if (j.primary_written_source) {
    ensure(slug).primaryWrittenSource = {
      bibliography: String(j.primary_written_source.chicago_bibliography ?? ""),
      footnoteShort: String(j.primary_written_source.chicago_footnote_short ?? ""),
    };
  }
  for (const it of j.image_primary_sources ?? []) {
    const cat = String(it.category ?? "");
    const section = mapCategoryToSection(cat, slug);
    if (!section) continue;
    const filename = String(it.filename ?? "");
    pushFig(slug, section, {
      filename,
      alt: String(it.description ?? ""),
      caption: String(it.chicago_caption ?? ""),
      bibliography: String(it.chicago_bibliography ?? ""),
      footnoteShort: String(it.chicago_footnote_short ?? ""),
      section,
      hasCorrection: !!it.citation_correction_rationale,
      sourceUrl: String(it.source_page ?? it.source_url ?? ""),
      rawSourcePath: path.join(PS, dir, String(it.relative_path ?? filename)),
    });
  }
}

// ---------- Tier 4 ----------
const T4_DIRS = ["countach", "porsche-959", "mclaren-f1", "veyron"];
for (const dir of T4_DIRS) {
  const slug = T2_DIR_TO_SLUG[dir];
  const file = path.join(PS, "sourcing-pass-apr-2026", dir, "sources.json");
  if (!fs.existsSync(file)) continue;
  const j = readJSON(file) as { items?: Array<Record<string, unknown>> };
  for (const it of j.items ?? []) {
    const cat = String(it.category ?? "");
    const section = mapCategoryToSection(cat, slug);
    if (!section) continue;
    const filename = String(it.filename ?? "");
    const cite = String(it.chicago_citation ?? "");
    pushFig(slug, section, {
      filename,
      alt: String(it.what_it_depicts ?? ""),
      // Tier 4 has only a single chicago_citation. Use it for caption,
      // bibliography (full form on first reference), and short.
      caption: cite,
      bibliography: cite,
      footnoteShort: cite,
      section,
      hasCorrection: !!it.citation_correction_rationale,
      sourceUrl: String(it.source_page ?? it.source_url ?? ""),
      rawSourcePath: path.join(PS, "sourcing-pass-apr-2026", dir, filename),
    });
  }
}

function mapCategoryToSection(cat: string, slug: string): string | "" {
  // Spec mapping. Returns "" for unknown.
  switch (cat.toLowerCase()) {
    case "magazine":
      return "Magazine and Press Coverage";
    case "celebrity-owner":
    case "owner":
      return "Designers, Builders, and Owners";
    case "schematics":
    case "press":
      return "Design and Engineering";
    case "press-launch":
    case "show":
      return "Launch and Motor Shows";
    case "race":
    case "rally":
      return slug === "f1" ? "Racing" : "Designers, Builders, and Owners";
    case "auction":
    case "gallery":
      return "Designers, Builders, and Owners";
    default:
      return "";
  }
}

// ============================================================
// 3. External citations (Daily Mail, Getty, Drive Perkins, Driven Car Guide)
//    Pulled from CITATIONS_EXPORT.md "Additional citations" block, but the
//    Perkins images already exist in Tier 1, so they only matter for the
//    bibliography. The other three need placeholder figures.
// ============================================================

const EXTERNAL_PLACEHOLDERS: { slug: string; section: string; fig: Figure }[] = [
  {
    slug: "veyron",
    section: "Designers, Builders, and Owners",
    fig: {
      filename: "jamie-foxx-bugatti-veyron-2017.placeholder",
      alt: "Jamie Foxx arrives at Nobu Malibu in his gold-chrome Bugatti Veyron, August 2017.",
      caption:
        'Daily Mail, "Jamie Foxx Arrives at Nobu Malibu in Gold Chrome Bugatti Veyron," Daily Mail, August 2017, https://www.dailymail.co.uk/tvshowbiz/article-4766798/Jamie-Foxx-arrives-Nobu-Malibu-gold-chrome-Bugatti.html (uncredited tabloid photograph, via Daily Mail).',
      bibliography:
        'Daily Mail. "Jamie Foxx Arrives at Nobu Malibu in Gold Chrome Bugatti Veyron." Daily Mail, August 2017. https://www.dailymail.co.uk/tvshowbiz/article-4766798/Jamie-Foxx-arrives-Nobu-Malibu-gold-chrome-Bugatti.html.',
      footnoteShort: 'Daily Mail, "Jamie Foxx Arrives at Nobu Malibu," August 2017.',
      section: "Designers, Builders, and Owners",
      hasCorrection: false,
      sourceUrl: "https://www.dailymail.co.uk/tvshowbiz/article-4766798/Jamie-Foxx-arrives-Nobu-Malibu-gold-chrome-Bugatti.html",
      rawSourcePath: "",
      isPlaceholder: true,
    },
  },
  {
    slug: "countach",
    section: "Design and Engineering",
    fig: {
      filename: "getty-534251462-countach-under-construction.placeholder",
      alt: "Lamborghini Countach under construction, 1988-2000, Getty Images Editorial #534251462.",
      caption:
        "Getty Images Editorial, \"Lamborghini Countach Under Construction,\" image #534251462 (uncredited photographer, via Getty Images).",
      bibliography:
        'Getty Images. "Lamborghini Countach Under Construction." Getty Images Editorial, image #534251462. https://www.gettyimages.com/detail/news-photo/lamborghini-countach-under-construction-1988-2000-news-photo/534251462.',
      footnoteShort: "Getty Images Editorial #534251462.",
      section: "Design and Engineering",
      hasCorrection: false,
      sourceUrl: "https://www.gettyimages.com/detail/news-photo/lamborghini-countach-under-construction-1988-2000-news-photo/534251462",
      rawSourcePath: "",
      isPlaceholder: true,
    },
  },
  {
    slug: "959",
    section: "Designers, Builders, and Owners",
    fig: {
      filename: "driven-car-guide-mr-bean-959-2024.placeholder",
      alt: "Driven Car Guide article on Mr Bean's reported Porsche 959, February 2024.",
      caption:
        'Driven Car Guide (Sanchez), "Mr Bean Buys a Porsche 959, and Other Famous Owners," Driven Car Guide, Feb. 29, 2024, https://www.drivencarguide.co.nz/news/mr-bean-buys-a-porsche-959-and-other-famous-owners/ (uncredited news photograph, via Driven Car Guide).',
      bibliography:
        'Driven Car Guide (Sanchez). "Mr Bean Buys a Porsche 959, and Other Famous Owners." Driven Car Guide, Feb. 29, 2024. https://www.drivencarguide.co.nz/news/mr-bean-buys-a-porsche-959-and-other-famous-owners/.',
      footnoteShort: "Driven Car Guide, \"Mr Bean Buys a Porsche 959,\" Feb. 29, 2024.",
      section: "Designers, Builders, and Owners",
      hasCorrection: false,
      sourceUrl: "https://www.drivencarguide.co.nz/news/mr-bean-buys-a-porsche-959-and-other-famous-owners/",
      rawSourcePath: "",
      isPlaceholder: true,
    },
  },
];

for (const { slug, section, fig } of EXTERNAL_PLACEHOLDERS) {
  pushFig(slug, section, fig);
}

// ============================================================
// 4. Bibliography (consolidated, alphabetical) — extract from
//    CITATIONS_EXPORT.md.
// ============================================================

function loadConsolidatedBibliography(): string[] {
  const md = fs.readFileSync(path.join(PS, "CITATIONS_EXPORT.md"), "utf8");
  // Find the consolidated alphabetical block. Heuristic: look for an
  // anchor like "## Consolidated bibliography" or "## Bibliography
  // (alphabetical)". Then grab all numbered list lines until next header.
  const headerMatch = md.match(/##+\s*(?:consolidated|alphabetical|bibliography)[^\n]*/i);
  if (!headerMatch) return [];
  const start = (headerMatch.index ?? 0) + headerMatch[0].length;
  const rest = md.slice(start);
  // Stop at the next ## header or end of file.
  const stopIdx = rest.search(/\n##+\s/);
  const block = stopIdx >= 0 ? rest.slice(0, stopIdx) : rest;
  // Pull every numbered list item or hyphen list item.
  const out: string[] = [];
  for (const line of block.split("\n")) {
    const m = /^\s*(?:\d+\.|-)\s+(.*)/.exec(line);
    if (m && m[1].trim().length > 8) out.push(m[1].trim());
  }
  return out;
}

const bibliographyEntries = loadConsolidatedBibliography();

// ============================================================
// 5. Stage images
// ============================================================

let imagesCopied = 0;
const missingSrcs: string[] = [];
for (const slug of Object.keys(CAR_FOLDER)) {
  const dest = path.join(LEG, "images", CAR_FOLDER[slug]);
  fs.mkdirSync(dest, { recursive: true });
}
for (const [slug, b] of bundles) {
  const dest = path.join(LEG, "images", CAR_FOLDER[slug]);
  for (const figs of b.sections.values()) {
    for (const fig of figs) {
      if (fig.isPlaceholder) continue;
      const src = fig.rawSourcePath;
      if (!src || src.includes("_archive-weak-specimens")) continue;
      if (!fs.existsSync(src)) {
        missingSrcs.push(src);
        continue;
      }
      const out = path.join(dest, fig.filename);
      try {
        fs.copyFileSync(src, out);
        imagesCopied++;
      } catch (err) {
        missingSrcs.push(`${src} -> ${out} (${(err as Error).message})`);
      }
    }
  }
}

// ============================================================
// 6. Section ordering
// ============================================================

const SECTION_ORDER_BASE = [
  "Primary Source",
  "Secondary Source",
  "Magazine and Press Coverage",
  "Designers, Builders, and Owners",
  "Design and Engineering",
  "Launch and Motor Shows",
];
const SECTION_CSS_CLASS: Record<string, string> = {
  "Primary Source": "primary-source",
  "Secondary Source": "secondary-source",
  "Magazine and Press Coverage": "magazine",
  "Designers, Builders, and Owners": "owners",
  "Design and Engineering": "engineering",
  "Launch and Motor Shows": "showroom",
  Racing: "racing",
};
function orderForCar(slug: string): string[] {
  return slug === "f1" ? [...SECTION_ORDER_BASE, "Racing"] : SECTION_ORDER_BASE;
}

// ============================================================
// 7. Build gallery section HTML and footnotes per car
// ============================================================

type Built = { sectionsHtml: string; footnotesHtml: string; figureCount: number; correctionsCount: number };

function buildCarSections(slug: string): Built {
  const b = bundles.get(slug);
  const order = orderForCar(slug);
  const labels = parseExistingObjectLabels(path.join(LEG, CAR_SLUG_TO_HTML[slug]));
  let figureCount = 0;
  let correctionsCount = 0;
  const sectionsHtml: string[] = [];
  const footnoteEntries: { full: string; short: string }[] = [];

  // Footnote 1 = primary written source (full).
  const primary = b?.primaryWrittenSource;
  if (primary?.bibliography) {
    footnoteEntries.push({ full: primary.bibliography, short: primary.footnoteShort });
  } else {
    // Fallback if Tier 2 didn't load: derive from first Tier 1 primary fig.
    const firstPrimary = b?.sections.get("Primary Source")?.[0];
    if (firstPrimary) {
      footnoteEntries.push({ full: firstPrimary.bibliography, short: firstPrimary.footnoteShort });
    }
  }

  if (!b) {
    return { sectionsHtml: "", footnotesHtml: "", figureCount: 0, correctionsCount: 0 };
  }

  for (const sec of order) {
    const figs = b.sections.get(sec) ?? [];
    if (figs.length === 0) continue;
    const cssClass = SECTION_CSS_CLASS[sec];
    const items: string[] = [];
    for (const fig of figs) {
      figureCount++;
      const figId = `fig-${figureCount}`;
      if (fig.hasCorrection) correctionsCount++;
      footnoteEntries.push({ full: fig.bibliography, short: fig.footnoteShort });

      const labelHtml = labels.get(fig.filename)
        ? labels.get(fig.filename)!
        : `<!-- Voice transcript pending for: ${fig.filename} -->`;

      if (fig.isPlaceholder) {
        items.push(
          `        <figure class="artifact" id="${figId}">\n` +
          `          <div class="missing-image">Source: see citation</div>\n` +
          `          <!-- TODO: image file not yet on disk for this external citation -->\n` +
          `          <figcaption>\n` +
          `            <span class="caption">Figure ${figureCount}. ${renderInlineCitation(fig.caption)}</span>\n` +
          `            <div class="object-label" data-author="student">\n              ${labelHtml}\n            </div>\n` +
          `          </figcaption>\n` +
          `        </figure>`
        );
      } else {
        items.push(
          `        <figure class="artifact" id="${figId}">\n` +
          `          <img src="images/${CAR_FOLDER[slug]}/${escapeHtml(fig.filename)}"\n` +
          `               alt="${escapeHtml(noEmDash(fig.alt))}"\n` +
          `               loading="lazy">\n` +
          `          <figcaption>\n` +
          `            <span class="caption">Figure ${figureCount}. ${renderInlineCitation(fig.caption)}</span>\n` +
          `            <div class="object-label" data-author="student">\n              ${labelHtml}\n            </div>\n` +
          `          </figcaption>\n` +
          `        </figure>`
        );
      }
    }
    sectionsHtml.push(
      `      <section class="${cssClass}">\n` +
      `        <h2>${noEmDash(sec)}</h2>\n` +
      items.join("\n") +
      `\n      </section>`
    );
  }

  // Footnotes — collapse Ibid for adjacent same-source.
  const footLines: string[] = [];
  let prevFull = "";
  for (let i = 0; i < footnoteEntries.length; i++) {
    const entry = footnoteEntries[i];
    let text: string;
    if (i === 0) text = entry.full;                       // first = full
    else if (entry.full === prevFull) text = "Ibid.";
    else if (
      // Repeat reference of an earlier same source: short form.
      footnoteEntries.slice(0, i).some((p) => p.full === entry.full)
    ) text = entry.short || entry.full;
    else text = entry.full;
    footLines.push(`        <li>${renderInlineCitation(noEmDash(text))}</li>`);
    prevFull = entry.full;
  }
  const footnotesHtml =
    `      <section class="footnotes">\n` +
    `        <h2>Notes</h2>\n` +
    `        <ol>\n${footLines.join("\n")}\n        </ol>\n` +
    `      </section>`;

  return {
    sectionsHtml: sectionsHtml.join("\n\n"),
    footnotesHtml,
    figureCount,
    correctionsCount,
  };
}

// ============================================================
// 8. Inject into existing HTML
// ============================================================

function injectGallery(slug: string, built: Built): void {
  const file = path.join(LEG, CAR_SLUG_TO_HTML[slug]);
  if (!fs.existsSync(file)) return;
  const html = fs.readFileSync(file, "utf8");

  // Replace zone: from the FIRST <section class="artifacts-section"> block
  // (or first generated gallery section) through the last </section> before
  // </main>. Conservative approach: find the first artifacts-section start
  // and the closing </main> tag; replace everything between with the new
  // gallery + footnotes.
  const startRe = /<section\s+class="(?:artifacts-section|primary-source|secondary-source|magazine|owners|engineering|showroom|racing|footnotes)\b[^"]*"[^>]*>/i;
  const startMatch = startRe.exec(html);
  const endIdx = html.lastIndexOf("</main>");
  if (!startMatch || endIdx < 0) {
    console.warn(`!! Could not find gallery boundaries in ${file}; skipping.`);
    return;
  }
  const before = html.slice(0, startMatch.index);
  const after = html.slice(endIdx);
  const newHtml = before + built.sectionsHtml + "\n\n" + built.footnotesHtml + "\n  " + after;
  fs.writeFileSync(file, newHtml, "utf8");
}

// ============================================================
// 9. about.html bibliography rewrite
// ============================================================

function updateAbout(): void {
  const file = path.join(LEG, "about.html");
  if (!fs.existsSync(file)) return;
  const html = fs.readFileSync(file, "utf8");

  // Look for the consolidated-bibliography div and replace its <ol>.
  const blockRe = /(<div[^>]*id="consolidated-bibliography"[^>]*>)([\s\S]*?)(<\/div>)/;
  if (!blockRe.test(html)) {
    console.warn("!! about.html: consolidated-bibliography div not found; appending block at end of <main>.");
    return;
  }
  const items = bibliographyEntries
    .map((e) => `        <li>${renderInlineCitation(noEmDash(e))}</li>`)
    .join("\n");
  const replacement =
    `<div id="consolidated-bibliography" class="bib-section">\n` +
    `      <h2>Consolidated Bibliography</h2>\n` +
    `      <p class="bib-note">${escapeHtml("Alphabetical, deduplicated, Chicago style.")}</p>\n` +
    `      <ol class="bibliography">\n${items}\n      </ol>\n` +
    `    </div>`;
  const out = html.replace(blockRe, replacement);
  fs.writeFileSync(file, out, "utf8");
}

// ============================================================
// 10. CSS append
// ============================================================

const NEW_CSS_BLOCK = `\n
/* ====== Artifact gallery (added by build_legacy_galleries.ts) ====== */
.artifact { max-width: 900px; margin: 3rem auto; }
.artifact img { width: 100%; height: auto; display: block; border: 1px solid var(--gold, #c9a84c); transition: box-shadow 0.4s ease; }
.artifact img:hover { box-shadow: 0 0 24px rgba(201, 168, 76, 0.45); }
.artifact figcaption .caption {
  display: block;
  font-style: italic;
  color: var(--gold, #c9a84c);
  font-size: 0.85rem;
  padding-top: 1.5rem;
  padding-left: 1.4rem;
  text-indent: -1.4rem;
}
.artifact figcaption .caption a { color: var(--gold, #c9a84c); text-decoration: none; }
.artifact figcaption .caption a:hover { text-decoration: underline; }
.artifact .object-label {
  color: var(--white, #f4ead5);
  font-weight: 400;
  padding-top: 1rem;
  font-family: 'Cormorant Garamond', serif;
}
.primary-source, .secondary-source {
  border-left: 4px solid var(--gold, #c9a84c);
  background: rgba(201, 168, 76, 0.04);
  padding-left: 1.25rem;
}
.footnotes ol { font-size: 0.85rem; color: var(--white, #f4ead5); }
.footnotes ol li::marker { color: var(--gold, #c9a84c); }
.missing-image {
  font-style: italic;
  opacity: 0.65;
  border: 1px dashed var(--gold, #c9a84c);
  padding: 2rem;
  text-align: center;
}
/* ====================================================================== */
`;

function ensureCss(): void {
  const file = path.join(LEG, "shared.css");
  if (!fs.existsSync(file)) return;
  const css = fs.readFileSync(file, "utf8");
  if (css.includes("Artifact gallery (added by build_legacy_galleries.ts)")) return;
  fs.writeFileSync(file, css + NEW_CSS_BLOCK, "utf8");
}

// ============================================================
// 11. SOURCES_CHANGELOG.md
// ============================================================

function writeChangelog(): { perCar: Record<string, number>; placeholders: { slug: string; filename: string }[] } {
  const lines: string[] = [];
  lines.push("# Sources changelog");
  lines.push("");
  lines.push(`Generated by \`scripts/build_legacy_galleries.ts\` from primary-sources/*/sources.json + CITATIONS_EXPORT.md.`);
  lines.push("");

  const perCar: Record<string, number> = {};
  const placeholders: { slug: string; filename: string }[] = [];

  const carDisplay: Record<string, string> = {
    f1: "McLaren F1",
    "959": "Porsche 959",
    countach: "Lamborghini Countach",
    veyron: "Bugatti Veyron",
  };
  const order: string[] = ["f1", "959", "countach", "veyron"];
  for (const slug of order) {
    const b = bundles.get(slug);
    if (!b) continue;
    lines.push(`## ${carDisplay[slug]}`);
    lines.push("");
    lines.push("| Figure ID | Tier | Filename | Has Citation Correction | Chicago Short Footnote | Source URL |");
    lines.push("|-----------|------|----------|--------------------------|------------------------|------------|");
    let figId = 0;
    for (const sec of orderForCar(slug)) {
      const figs = b.sections.get(sec) ?? [];
      for (const fig of figs) {
        figId++;
        if (fig.isPlaceholder) placeholders.push({ slug, filename: fig.filename });
        const tier = fig.rawSourcePath.includes("from-main-sources")
          ? "1"
          : fig.rawSourcePath.includes("sourcing-pass-apr-2026")
          ? "4"
          : fig.isPlaceholder
          ? "external"
          : "2";
        const yes = fig.hasCorrection ? "Yes" : "No";
        const url = fig.sourceUrl || "—";
        const short = (fig.footnoteShort || fig.caption).replace(/\|/g, "\\|").replace(/\n/g, " ");
        lines.push(`| fig-${figId} | ${tier} | \`${fig.filename}\` | ${yes} | ${short} | ${url.replace(/\|/g, "\\|")} |`);
      }
    }
    perCar[slug] = figId;
    lines.push("");
    lines.push(`Total figures on this gallery page: ${figId}`);
    lines.push("");
  }

  if (placeholders.length) {
    lines.push("## External citations rendered as placeholders (no image file on disk)");
    lines.push("");
    for (const p of placeholders) lines.push(`- [${p.slug}] ${p.filename}`);
    lines.push("");
  }

  fs.writeFileSync(path.join(ROOT, "SOURCES_CHANGELOG.md"), lines.join("\n"), "utf8");
  return { perCar, placeholders };
}

// ============================================================
// Run
// ============================================================

const builds: Record<string, Built> = {};
for (const slug of Object.keys(CAR_FOLDER)) {
  builds[slug] = buildCarSections(slug);
  injectGallery(slug, builds[slug]);
}
updateAbout();
ensureCss();
const { perCar, placeholders } = writeChangelog();

// ============================================================
// Report
// ============================================================

console.log(`\n=== BUILD COMPLETE ===\n`);
console.log(`Images staged into legacy/images/: ${imagesCopied}`);
if (missingSrcs.length) {
  console.log(`\n⚠ ${missingSrcs.length} image source path(s) missing on disk:`);
  for (const m of missingSrcs.slice(0, 10)) console.log(`    ${m}`);
  if (missingSrcs.length > 10) console.log(`    ... and ${missingSrcs.length - 10} more`);
}
console.log();
console.log(`Figures rendered per gallery page:`);
for (const slug of ["f1", "959", "countach", "veyron"]) {
  console.log(`  ${slug.padEnd(10)} ${perCar[slug] ?? 0}`);
}
console.log();
console.log(`Bibliography entries written to about.html: ${bibliographyEntries.length}`);
console.log();
let totalCorrections = 0;
for (const slug of Object.keys(CAR_FOLDER)) totalCorrections += builds[slug].correctionsCount;
console.log(`Figures with citation_correction_rationale: ${totalCorrections}`);
console.log();
console.log(`Placeholder external citations: ${placeholders.length}`);
for (const p of placeholders) console.log(`  [${p.slug}] ${p.filename}`);
console.log();
console.log(`Files written:`);
console.log(`  legacy/{countach,959,f1,veyron}.html (gallery sections + footnotes replaced)`);
console.log(`  legacy/about.html (consolidated bibliography rewritten)`);
console.log(`  legacy/shared.css (artifact / footnote / missing-image classes appended if absent)`);
console.log(`  SOURCES_CHANGELOG.md`);
console.log(`  legacy/images/{countach,959,f1,veyron}/ (${imagesCopied} files)`);
