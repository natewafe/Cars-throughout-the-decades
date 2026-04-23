#!/usr/bin/env python3
"""
Generator: wires primary-source artifacts into the four gallery pages
and extends the bibliography on about.html. Run from repo root.
"""

import json
import os
import re
import shutil
import sys
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent
PS = ROOT / "primary-sources"
LEGACY = ROOT / "legacy"
IMG_OUT = LEGACY / "images"

# Map car slug to: legacy HTML file, tier-2 source folder, tier-1 decade-key
CARS = [
    {"slug": "countach",    "page": "countach.html", "t2_dir": "countach",    "t1_key": "1970s-countach",    "display": "Lamborghini Countach"},
    {"slug": "porsche-959", "page": "959.html",      "t2_dir": "porsche-959", "t1_key": "1980s-porsche-959", "display": "Porsche 959"},
    {"slug": "mclaren-f1",  "page": "f1.html",       "t2_dir": "mclaren-f1",  "t1_key": "1990s-mclaren-f1",  "display": "McLaren F1"},
    {"slug": "veyron",      "page": "veyron.html",   "t2_dir": "veyron",      "t1_key": "2000s-veyron",      "display": "Bugatti Veyron EB 16.4"},
]

CATEGORY_SECTIONS = [
    ("magazine",        "Magazine & Press Coverage"),
    ("celebrity-owner", "Designers, Builders, and Owners"),
    ("schematics",      "Design & Engineering"),
    ("press-launch",    "Launch & Motor Shows"),
]

URL_RE = re.compile(r"(https?://[^\s),]+)")
# Italic markers *x* from markdown
ITAL_RE = re.compile(r"\*([^*]+)\*")

def md_to_html(text):
    """Convert markdown italics and URLs in chicago strings into HTML.
    Strips em dashes (replaced with comma) to satisfy the exhibit style rule."""
    text = text.replace(" — ", ", ").replace("—", ",")
    text = ITAL_RE.sub(r"<em>\1</em>", text)
    text = URL_RE.sub(r'<a href="\1" target="_blank" rel="noopener">\1</a>', text)
    return text


def load_json(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def build_caption_html(entry, source_page_url):
    """Build the caption text: render chicago_caption with markdown; strip the
    trailing URL (it is redundant with the appended [Source] link); append
    a license tag."""
    raw = entry["chicago_caption"]
    # Strip any trailing raw URL (with optional trailing punctuation)
    raw = re.sub(r',?\s*https?://\S+?\.?\s*$', '', raw.rstrip())
    raw = raw.rstrip(",. ")
    caption_html = md_to_html(raw + ".")
    license_str = entry.get("license", "").strip()
    if license_str:
        license_clean = license_str.replace(" — ", ", ").replace("—", ",")
        caption_html += f' <span class="caption-license">({license_clean})</span>'
    return caption_html


def section_header(title, kicker=None):
    kicker_html = f'<p class="pillar-kicker">{kicker}</p>' if kicker else ""
    return (
        f'\n  <section class="artifacts-section">\n'
        f'    <header class="pillar-header">\n'
        f'      {kicker_html}\n'
        f'      <h2 class="pillar-heading">{title}</h2>\n'
        f'    </header>\n'
    )

def render_figure(entry, fig_id, footnote_n, car_slug):
    fname = entry["filename"]
    alt_raw = entry.get("description", fname)
    alt = alt_raw.replace(" — ", ", ").replace("—", ",").replace('"', '&quot;')
    caption = build_caption_html(entry, entry.get("source_page", ""))
    # Link source_page (not source_url). For Wikimedia items the per-car JSON
    # has wikimedia_title instead of source_page; build the Commons article URL
    # from the title so the link goes to the file description page, not the raw
    # image.
    src_link = entry.get("source_page", "")
    if not src_link:
        wt = entry.get("wikimedia_title", "")
        if wt:
            src_link = "https://commons.wikimedia.org/wiki/" + wt.replace(" ", "_")
    if not src_link:
        src_link = entry.get("source_url", "")
    src_link_html = f'<a class="caption-source-link" href="{src_link}" target="_blank" rel="noopener">[Source]</a>' if src_link else ""
    placeholder = f"Voice transcript pending for: {fname}"

    return (
        f'    <figure class="artifact" id="fig-{fig_id}">\n'
        f'      <img src="images/{car_slug}/{fname}" alt="{alt}" loading="lazy">\n'
        f'      <figcaption>\n'
        f'        <span class="caption">Figure {fig_id}. {caption} {src_link_html}'
        f'<sup class="fnref"><a href="#fn-{footnote_n}">{footnote_n}</a></sup></span>\n'
        f'        <div class="object-label" data-author="student">\n'
        f'          <!-- STUDENT LABEL TEXT, DO NOT WRITE.\n'
        f'               Placeholder: "{placeholder}" -->\n'
        f'        </div>\n'
        f'      </figcaption>\n'
        f'    </figure>\n'
    )


def copy_image(src_path, car_slug, filename):
    dest_dir = IMG_OUT / car_slug
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / filename
    if src_path.exists():
        shutil.copy2(src_path, dest)
        return True
    return False


def run():
    tier1 = load_json(PS / "from-main-sources" / "sources.json")
    per_car = {c["slug"]: load_json(PS / c["t2_dir"] / "sources.json") for c in CARS}

    changelog_rows = []   # tuples: (filename, page, tier, figure_number)
    # Global collections for bibliography
    all_bib_strings = set()

    # Collect primary_written_source bibliographies too
    for slug, pc in per_car.items():
        all_bib_strings.add(pc["primary_written_source"]["chicago_bibliography"])

    for car in CARS:
        slug = car["slug"]
        page_path = LEGACY / car["page"]
        pc = per_car[slug]

        # Tier 1 images for this car
        t1_decade = tier1["folders"][car["t1_key"]]
        # t1_decade is dict like { "primary-<name>": [entries], "secondary-<name>": [entries] }
        t1_primary = []
        t1_secondary = []
        for section_key, entries in t1_decade.items():
            for e in entries:
                e2 = dict(e)  # copy
                e2["__tier"] = 1
                e2["__tier1_section"] = section_key  # primary-... or secondary-...
                if section_key.startswith("primary"):
                    t1_primary.append(e2)
                else:
                    t1_secondary.append(e2)

        # Tier 1 source paths
        t1_source_base = PS / "from-main-sources" / car["t1_key"]

        # Tier 2 images for this car
        t2_entries = pc.get("image_primary_sources", [])
        # Mark tier
        for e in t2_entries:
            e["__tier"] = 2

        # Dedupe: skip tier-2 entries whose source_url matches any tier-1 entry
        t1_source_urls = {e.get("source_url") for e in (t1_primary + t1_secondary)}
        t2_entries = [e for e in t2_entries if e.get("source_url") not in t1_source_urls]

        # Tier 2 source paths
        t2_source_base = PS / car["t2_dir"]

        # Figure/footnote numbering. Figure 1 = first tier-1 primary figure.
        # Footnote 1 = primary_written_source. Footnote 2 = first figure's short cite. etc.
        fig_counter = 0
        fn_counter = 1  # Start at 1 because fn-1 is primary_written_source
        footnotes = [pc["primary_written_source"]["chicago_footnote_short"]]

        # Build sections HTML
        sections_html = []

        def add_entries(entries, section_title, tier_label, kicker=None):
            nonlocal fig_counter, fn_counter
            if not entries:
                return
            sec = section_header(section_title, kicker=kicker)
            body = []
            for e in entries:
                # Locate source file
                if e["__tier"] == 1:
                    src = t1_source_base / e["relative_path"]
                else:
                    src = t2_source_base / e["relative_path"]
                if not src.exists():
                    print(f"[skip-missing] {src}")
                    continue
                # Copy to legacy/images/<car>/
                copy_image(src, slug, e["filename"])
                fig_counter += 1
                fn_counter += 1
                fig_id = fig_counter
                fn_id = fn_counter
                body.append(render_figure(e, fig_id, fn_id, slug))
                footnotes.append(e["chicago_footnote_short"])
                changelog_rows.append((e["filename"], car["page"], tier_label, fig_id))
                all_bib_strings.add(e["chicago_bibliography"])
            if body:
                sec += "".join(body)
                sec += "  </section>\n"
                sections_html.append(sec)

        # 1) Primary Source (Tier 1 primary)
        add_entries(t1_primary, "Primary Source Artifacts", "Tier 1, Primary",
                    kicker="Tier 1")

        # 2) Secondary Source (Tier 1 secondary)
        add_entries(t1_secondary, "Secondary Source Artifacts", "Tier 1, Secondary",
                    kicker="Tier 1")

        # 3) Tier 2 grouped by category
        t2_by_cat = defaultdict(list)
        for e in t2_entries:
            t2_by_cat[e.get("category", "misc")].append(e)

        for cat_key, cat_title in CATEGORY_SECTIONS:
            if cat_key in t2_by_cat:
                add_entries(t2_by_cat[cat_key], cat_title, f"Tier 2, {cat_key}",
                            kicker="Tier 2")

        # Build footnotes section
        fn_html = [
            '\n  <section class="footnotes">\n',
            '    <h3 class="footnotes-heading">Footnotes</h3>\n',
            '    <ol class="footnotes-list">\n',
        ]
        for i, fn in enumerate(footnotes, start=1):
            fn_rendered = md_to_html(fn)
            fn_html.append(f'      <li id="fn-{i}">{fn_rendered}</li>\n')
        fn_html.append('    </ol>\n  </section>\n')

        intro_html = (
            '\n  <section class="primary-source-intro">\n'
            '    <p class="pillar-sub">\n'
            '      The written primary source for this gallery is '
            + md_to_html(pc["primary_written_source"]["chicago_bibliography"]).replace(" — ", ", ")
            + '<sup class="fnref"><a href="#fn-1">1</a></sup>\n'
            '    </p>\n'
            '  </section>\n'
        )

        full_block = intro_html + "".join(sections_html)

        # Inject into page
        with open(page_path, encoding="utf-8") as f:
            content = f.read()

        # Remove any previous generated block (idempotency)
        content = re.sub(
            r'<!-- BEGIN GENERATED SOURCES -->.*?<!-- END GENERATED SOURCES -->\n?',
            '', content, flags=re.DOTALL
        )
        content = re.sub(
            r'<!-- BEGIN GENERATED FOOTNOTES -->.*?<!-- END GENERATED FOOTNOTES -->\n?',
            '', content, flags=re.DOTALL
        )

        # Insert sources block right after <main class="gallery-content">
        wrapped = (
            '<!-- BEGIN GENERATED SOURCES -->\n'
            + full_block
            + '<!-- END GENERATED SOURCES -->\n'
        )
        if '<main class="gallery-content">' not in content:
            print(f"[warn] no <main class=\"gallery-content\"> in {page_path.name}")
            continue
        content = content.replace(
            '<main class="gallery-content">',
            '<main class="gallery-content">\n' + wrapped,
            1
        )

        # Insert footnotes block right before </main>
        fn_wrapped = (
            '<!-- BEGIN GENERATED FOOTNOTES -->\n'
            + ''.join(fn_html)
            + '<!-- END GENERATED FOOTNOTES -->\n'
        )
        content = content.replace('</main>', fn_wrapped + '  </main>', 1)

        with open(page_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"[wrote] {page_path.name}: {fig_counter} figures")

    # ---- Bibliography extension ----
    # Include ALL chicago_bibliography from tier-1 (each folder's entries)
    for decade_key, folder_obj in tier1["folders"].items():
        for section_key, entries in folder_obj.items():
            for e in entries:
                all_bib_strings.add(e["chicago_bibliography"])
    # Include ALL tier-2 chicago_bibliography, even for rows whose file is missing
    # on disk. The bibliography cites the source regardless of whether the image
    # was resolvable at build time.
    for slug, pc in per_car.items():
        for e in pc.get("image_primary_sources", []):
            all_bib_strings.add(e["chicago_bibliography"])

    # Sort alphabetically by first sortable token (approx "last name")
    def sort_key(s):
        # Strip leading quotes/asterisks/accents to get to first word
        stripped = re.sub(r'^[\s"\*\[]+', '', s)
        return stripped.lower()

    sorted_bib = sorted(all_bib_strings, key=sort_key)

    update_about_bibliography(sorted_bib)

    # ---- Changelog ----
    write_changelog(changelog_rows)

    # ---- Inject CSS rules ----
    inject_css()

    print(f"\n[ok] {len(changelog_rows)} images wired, {len(sorted_bib)} bibliography entries consolidated")


def update_about_bibliography(sorted_bib):
    """Append a new 'Consolidated Primary-Source Bibliography' section to about.html
    that contains every chicago_bibliography string deduped and alphabetized.
    Preserve the existing student bibliography section."""
    about = LEGACY / "about.html"
    with open(about, encoding="utf-8") as f:
        content = f.read()

    # Remove prior generated bibliography block if present (idempotency)
    content = re.sub(
        r'<!-- BEGIN GENERATED BIBLIOGRAPHY -->.*?<!-- END GENERATED BIBLIOGRAPHY -->\n?',
        '', content, flags=re.DOTALL
    )

    entries_html = []
    for b in sorted_bib:
        rendered = md_to_html(b).replace(" — ", ", ")
        entries_html.append(
            '      <div class="bib-entry">\n'
            f'        <p class="bib-citation">{rendered}</p>\n'
            '      </div>'
        )

    block = (
        '\n<!-- BEGIN GENERATED BIBLIOGRAPHY -->\n'
        '    <div class="bib-section" id="consolidated-bibliography">\n'
        '      <h2>Consolidated Primary-Source Bibliography</h2>\n'
        '      <p class="bib-note">Every artifact cited across the four gallery pages, deduplicated and alphabetized by author.</p>\n'
        + "\n".join(entries_html) + "\n"
        '    </div>\n'
        '<!-- END GENERATED BIBLIOGRAPHY -->\n'
    )

    # Insert just before </main>
    content = content.replace('</main>', block + '  </main>', 1)

    with open(about, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[wrote] about.html: {len(sorted_bib)} bibliography entries")


def write_changelog(rows):
    path = ROOT / "SOURCES_CHANGELOG.md"
    lines = [
        "# SOURCES_CHANGELOG\n\n",
        "Every image wired into the gallery pages by the primary-source build step.\n",
        "Sort order follows page, then figure number.\n\n",
        "| Filename | Page | Tier | Figure # |\n",
        "| --- | --- | --- | --- |\n",
    ]
    rows_sorted = sorted(rows, key=lambda r: (r[1], r[3]))
    for (fname, page, tier, fig_num) in rows_sorted:
        lines.append(f"| `{fname}` | `{page}` | {tier} | {fig_num} |\n")
    with open(path, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print(f"[wrote] SOURCES_CHANGELOG.md: {len(rows)} rows")


CSS_BLOCK = r"""
/* === primary-source artifacts, generated === */
.primary-source-intro {
  max-width: 820px;
  margin: 0 auto 3.5rem;
  padding-top: 1.5rem;
}
.primary-source-intro .pillar-sub {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 1rem;
  line-height: 1.75;
  color: rgba(245,240,232,0.72);
}
.artifacts-section {
  margin: 0 auto 5rem;
  max-width: 920px;
}
.pillar-header {
  margin-bottom: 2.5rem;
  border-bottom: 1px solid rgba(201,168,76,0.2);
  padding-bottom: 0.9rem;
}
.pillar-kicker {
  font-family: 'DM Mono', monospace;
  font-size: 0.6rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: 0.4rem;
}
.pillar-heading {
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(1.8rem, 3.5vw, 2.4rem);
  letter-spacing: 0.04em;
  color: var(--white);
}
figure.artifact {
  margin: 0 0 4rem;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(201,168,76,0.1);
  padding: 1rem 1rem 1.5rem;
}
figure.artifact img {
  display: block;
  width: 100%;
  height: auto;
  margin-bottom: 1rem;
  background: #050505;
}
figure.artifact figcaption {
  padding: 0 0.25rem;
}
figure.artifact .caption {
  display: block;
  font-family: 'Cormorant Garamond', serif;
  font-size: 0.92rem;
  line-height: 1.65;
  color: rgba(245,240,232,0.72);
  font-style: italic;
}
figure.artifact .caption a {
  color: var(--gold);
  text-decoration: none;
  border-bottom: 1px dotted rgba(201,168,76,0.4);
  word-break: break-word;
}
figure.artifact .caption a:hover { border-bottom-color: var(--gold); }
figure.artifact .caption-license {
  font-family: 'DM Mono', monospace;
  font-size: 0.58rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--text-secondary);
  font-style: normal;
  margin-left: 0.25rem;
}
.caption-source-link {
  font-family: 'DM Mono', monospace;
  font-size: 0.6rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin-left: 0.3rem;
}
figure.artifact > figcaption > .object-label[data-author="student"] {
  margin-top: 1rem;
  min-height: 1rem;
}
.fnref {
  font-size: 0.7rem;
}
.fnref a {
  color: var(--gold);
  text-decoration: none;
  padding: 0 0.15rem;
}
.footnotes {
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(201,168,76,0.2);
}
.footnotes-heading {
  font-family: 'DM Mono', monospace;
  font-size: 0.65rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: 1rem;
}
.footnotes-list {
  list-style: decimal;
  padding-left: 1.75rem;
  color: rgba(245,240,232,0.7);
  font-size: 0.82rem;
  line-height: 1.75;
}
.footnotes-list li {
  margin-bottom: 0.4rem;
}
.footnotes-list a {
  color: var(--gold);
  text-decoration: none;
}
.bib-note {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 0.9rem;
  color: rgba(245,240,232,0.55);
  margin-bottom: 1.5rem;
}
"""

def inject_css():
    css_path = LEGACY / "shared.css"
    with open(css_path, encoding="utf-8") as f:
        content = f.read()
    # Remove previous generated CSS block (idempotency)
    content = re.sub(
        r'/\* BEGIN GENERATED ARTIFACTS CSS \*/.*?/\* END GENERATED ARTIFACTS CSS \*/\n?',
        '', content, flags=re.DOTALL
    )
    content = content.rstrip() + "\n\n/* BEGIN GENERATED ARTIFACTS CSS */\n" + CSS_BLOCK + "\n/* END GENERATED ARTIFACTS CSS */\n"
    with open(css_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("[wrote] shared.css: artifact styles injected")


if __name__ == "__main__":
    run()
