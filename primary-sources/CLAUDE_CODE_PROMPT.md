# Claude Code Prompt — Wire Primary Sources Into Velocity & Vision

Copy everything inside the code-fence below and paste into Claude Code from the repo root. The prompt assumes:

- You are at the root of the `Cars-throughout-the-decades` repo.
- The `primary-sources/` folder (this folder) is committed at the repo root.
- The legacy Next.js / legacy HTML gallery pages are in `legacy/` (`countach.html`, `959.html`, `f1.html`, `veyron.html`, `about.html`, `shared.css`).

---

```
You are working on the Velocity & Vision Virtual Museum, a UTK history class exhibit about four supercars — Lamborghini Countach LP400 (1970s), Porsche 959 (1980s), McLaren F1 (1990s), Bugatti Veyron EB 16.4 (2000s). The repo has four gallery pages plus an about/bibliography page in /legacy/. A companion folder /primary-sources/ contains curated first-party image assets with machine-readable Chicago-style citations.

Your job: wire the primary-source images into the gallery pages and extend the bibliography, without touching student-authored paragraph text.

## Inputs you already have
- /primary-sources/MANIFEST.md — human-readable index of all images
- /primary-sources/<car>/sources.json — per-car manifest with image metadata, chicago_caption, chicago_bibliography, chicago_footnote_short, primary_written_source
- /primary-sources/<car>/<category>/<filename>.jpg — the actual image files, organized by {magazine, celebrity-owner, schematics, press-launch}
- /legacy/countach.html, /legacy/959.html, /legacy/f1.html, /legacy/veyron.html — gallery pages to update
- /legacy/about.html — bibliography page to extend
- /legacy/shared.css — site styles (black bg, gold accents --gold: #c9a84c, Cormorant Garamond body, Bebas Neue headings)

## What to do

### 1. For each gallery page (countach.html, 959.html, f1.html, veyron.html)

Load the corresponding /primary-sources/<car>/sources.json. For each image in image_primary_sources:

a) Copy the image file into a web-accessible location. Use /legacy/images/<car>/<filename> (create the folder if needed). Keep the original filename — it's already kebab-cased and descriptive.

b) Render each image in a <figure class="artifact"> block with this structure:

    <figure class="artifact" id="fig-<id>">
      <img src="images/<car>/<filename>" alt="<description>" loading="lazy">
      <figcaption>
        <span class="caption">Figure <id>. <chicago_caption with URL linked></span>
        <div class="object-label" data-author="student">
          <!-- STUDENT LABEL TEXT — DO NOT WRITE. Leave a placeholder comment:
               "Voice transcript pending for: <filename>" -->
        </div>
      </figcaption>
    </figure>

c) Group the <figure> blocks into four <section> elements per page, one per category: magazine, celebrity-owner, schematics, press-launch. Use the section headings "Magazine & Press Coverage", "Designers, Builders, and Owners", "Design & Engineering", "Launch & Motor Shows" in that order.

d) At the bottom of each page, before </main>, add a <section class="footnotes"> with an <ol> of numbered footnotes. Number them chronologically as images appear on the page. Use the chicago_footnote_short field from sources.json for each. The PRIMARY written source (primary_written_source block) must be footnote #1 on every page; the images that follow are numbered 2, 3, 4… in the order they appear.

### 2. For about.html (bibliography)

Extend the existing bibliography list with every chicago_bibliography entry from all four sources.json files, deduplicated if any overlap. Sort alphabetically by author's last name (treat "Uncredited" and "Unknown photographer" under U). Preserve the existing entries for the four PRIMARY written sources (Road & Track 1976, Car and Driver 1987, Autocar 1994, Autocar 2005) and the already-listed secondary sources.

### 3. Do NOT touch
- Any existing paragraph text inside <div class="object-label"> or elsewhere on the gallery pages — those are student-authored and may only be edited by the student.
- The curatorial statement / introduction block on index.html.
- The tagline text on home-page cards (student approved keeping short UI text).
- Any tracked-changes comments or TODOs referencing footer course number.

### 4. Constraints

- No em dashes in any text you write (captions, headings, alt text). Replace with commas or reword.
- Do not invent facts not present in sources.json or primary_written_source.
- If you render captions as HTML, link the URL in the caption to the Wikimedia Commons file page (not the direct image), so viewers land on the license/attribution page.
- Every CC BY-SA image requires author + license in the visible caption. CC BY requires author. Public domain requires author if known.
- Preserve image quality: copy files as-is, no resizing. If lazy-loading is already in the site, keep it on.

### 5. Final pass

- Build the site and verify all <img> srcs resolve.
- Run an HTML validator pass on all five pages.
- Write a SOURCES_CHANGELOG.md at repo root listing every image added, the gallery page it lives on, and its figure number.
- Do not commit until I've reviewed.
```

---

## Notes for you (Nathan)

**Before running the prompt**, replace the `<div class="object-label">` placeholder comment with your voice transcript once you've recorded it — Claude Code will not write the label prose.

**If you want AI help on any one label**, invoke Claude Code separately with:

> For the image `primary-sources/<car>/<category>/<filename>.jpg`, write exactly one factual sentence drawn from the primary written source in `sources.json`. Do not paraphrase any other section of the page. No em dashes.

That enforces the one-sentence-from-primary-source rule from the project brief.

**If a caption's Wikimedia link ever 404s**, check the `wikimedia_title` field in sources.json — the file might have been renamed on Commons. The image itself in `/primary-sources/` is pinned.

**Course number placeholder**: still TODO per the project brief. Update in the footer of `shared.css` or wherever the placeholder lives, not via this prompt.
