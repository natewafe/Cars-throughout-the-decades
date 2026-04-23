# Claude Code Prompt — Wire Primary Sources Into Velocity & Vision

Copy everything inside the code-fence below and paste into Claude Code from the repo root. The prompt assumes:

- You are at the root of the `Cars-throughout-the-decades` repo.
- The `primary-sources/` folder (this folder) is committed at the repo root.
- The legacy gallery pages are in `legacy/` (`countach.html`, `959.html`, `f1.html`, `veyron.html`, `about.html`, `shared.css`).

---

```
You are working on the Velocity & Vision Virtual Museum, a UTK history class exhibit about four supercars — Lamborghini Countach LP400 (1970s), Porsche 959 (1980s), McLaren F1 (1990s), Bugatti Veyron EB 16.4 (2000s). The repo has four gallery pages plus an about/bibliography page in /legacy/. A companion folder /primary-sources/ contains curated first-party image assets with machine-readable Chicago-style citations.

Your job: wire the primary-source images into the gallery pages and extend the bibliography, without touching student-authored paragraph text.

## TIERED INPUT — use in this order

### Tier 1 (PRIORITY — must be used first)
/primary-sources/from-main-sources/sources.json — master manifest
/primary-sources/from-main-sources/<decade>-<car>/<primary|secondary>-<source-slug>/*.jpg — 29 artifacts pulled directly from the 8 sources in the student's annotated bibliography. These are the artifacts the essay's footnotes will cite. Lead every gallery page with these.

### Tier 2 (supplementary)
/primary-sources/<car>/sources.json — per-car manifest
/primary-sources/<car>/{magazine,celebrity-owner,schematics,press-launch}/*.{jpg,webp} — additional period artifacts (Walter Wolf Countach, Elon Musk F1 delivery 1999, Bugatti chassis 5.0 press, etc.) and specimen photos. Use to fill categories Tier 1 does not cover.

### Tier 3 (de-prioritized — ignore unless filling a specific hole)
/primary-sources/<car>/_archive-weak-specimens/ — cut specimens; only use if a gallery page needs an additional angle not present in Tiers 1 or 2.

## Other inputs
/legacy/countach.html, /legacy/959.html, /legacy/f1.html, /legacy/veyron.html — gallery pages
/legacy/about.html — bibliography page
/legacy/shared.css — site styles (black bg, gold accents --gold: #c9a84c, Cormorant Garamond body, Bebas Neue headings)

## What to do

### 1. For each gallery page (countach.html, 959.html, f1.html, veyron.html)

a) Copy images into /legacy/images/<car>/ (create the folder if needed). Keep the original filenames — they're already kebab-cased and descriptive. Preserve image quality, no resizing.

b) Lead the page with a "Primary Source" section containing a large figure for each Tier 1 primary-source image (from primary-<source-slug>/). Then a "Secondary Source" section with the secondary-<source-slug>/ images. Then, if the page needs more breadth, pull from Tier 2 into sections titled "Magazine & Press Coverage", "Designers, Builders, and Owners", "Design & Engineering", "Launch & Motor Shows".

c) Render each image as:

    <figure class="artifact" id="fig-<id>">
      <img src="images/<car>/<filename>" alt="<description>" loading="lazy">
      <figcaption>
        <span class="caption">Figure <id>. <chicago_caption with URL linked></span>
        <div class="object-label" data-author="student">
          <!-- STUDENT LABEL TEXT — DO NOT WRITE. Placeholder: "Voice transcript pending for: <filename>" -->
        </div>
      </figcaption>
    </figure>

d) At the bottom of each page, before </main>, add a <section class="footnotes"> with a numbered <ol> of footnotes. Number them chronologically as figures appear on the page. The primary written source (from primary_written_source in sources.json) is footnote #1 on every page; figures that follow are 2, 3, 4… Use chicago_footnote_short from each figure's metadata.

### 2. For about.html (bibliography)

Extend the existing bibliography with every chicago_bibliography entry from all four of from-main-sources' subfolders AND from each per-car sources.json. Deduplicate any overlaps. Sort alphabetically by author's last name. Preserve any entries already there.

### 3. Do NOT touch
- Any existing paragraph text inside <div class="object-label"> or elsewhere on the gallery pages. Student-authored.
- The curatorial statement on index.html.
- Home-page card taglines.
- Footer course-number placeholder.

### 4. Constraints
- No em dashes anywhere in text you write. Replace with commas or reword.
- Do not invent facts not present in sources.json or primary_written_source.
- Link captions' URLs to the source_page (article page), not source_url (raw image).
- Every CC BY-SA image requires author + license in the visible caption. CC BY requires author. Public domain requires author if known.
- Magazine-scan and fair-use items: include the short credit line "(Fair use, educational — <Publisher> archive)" in the caption.

### 5. Final pass
- Build the site and verify all <img> srcs resolve.
- HTML-validate every page.
- Write SOURCES_CHANGELOG.md at repo root listing every image added, which gallery page it lives on, which tier it came from, and its figure number.
- Do not commit until I review.
```

---

## Notes for you (Nathan)

Replace the `<div class="object-label">` placeholder comment with your voice transcript once recorded. Claude Code will not write label prose.

For one AI sentence per label (the allowed factual sentence), invoke Code separately:

> For the image `primary-sources/from-main-sources/<decade-car>/<sub>/<filename>`, write exactly one factual sentence drawn from the primary written source in `sources.json`. Do not paraphrase any other section. No em dashes.

If a caption's source URL ever 404s, the image file in `/primary-sources/` is pinned and the `source_page` URL in sources.json provides the provenance.

Course number placeholder in the footer: still TODO — update manually in `shared.css` or the footer partial.
