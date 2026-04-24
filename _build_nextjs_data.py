#!/usr/bin/env python3
"""Generate src/lib/artifacts.ts (figure + footnote data per car) and
src/lib/scenes.ts (scroll-scene keyframes + captions per car) from the
primary-sources JSONs."""

import json, re, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PS = ROOT / "primary-sources"
LIB = ROOT / "src" / "lib"
PUBLIC = ROOT / "public" / "artifacts"
LIB.mkdir(parents=True, exist_ok=True)

# Map gallery slug to: folder keys used across the tiers + the Next.js car slug.
# t4_dir is the sourcing-pass-apr-2026 folder for Tier 4.
CARS = [
    {"slug": "countach", "t2_dir": "countach",    "t1_key": "1970s-countach",    "img_dir": "countach",    "t4_dir": "countach"},
    {"slug": "959",      "t2_dir": "porsche-959", "t1_key": "1980s-porsche-959", "img_dir": "porsche-959", "t4_dir": "porsche-959"},
    {"slug": "f1",       "t2_dir": "mclaren-f1",  "t1_key": "1990s-mclaren-f1",  "img_dir": "mclaren-f1",  "t4_dir": "mclaren-f1"},
    {"slug": "veyron",   "t2_dir": "veyron",      "t1_key": "2000s-veyron",      "img_dir": "veyron",      "t4_dir": "veyron"},
]

# Ordered category to section mapping. Multiple category keys can feed one
# section; the section is emitted only if it has items, and in this order.
SECTION_ORDER = [
    ("Magazine & Press Coverage", ["magazine"]),
    ("Designers, Builders, and Owners", ["celebrity-owner", "owner"]),
    ("Design & Engineering", ["schematics", "press"]),
    ("Launch & Motor Shows", ["press-launch", "show", "gallery", "auction"]),
    ("Racing", ["race", "rally"]),
]
# Flat list of (category, section-title) pairs in canonical order, for tier 2.
CATEGORY_SECTIONS = [(cat, title) for title, cats in SECTION_ORDER for cat in cats]

# Scroll-scene camera keyframes and captions per car (ported from legacy/scroll-scene injection)
SCENES = {
    "countach": {
        "keyframes": [
            [0.00, "25deg 78deg 105%"],
            [0.18, "80deg 84deg 92%"],
            [0.38, "170deg 82deg 110%"],
            [0.58, "265deg 78deg 95%"],
            [0.80, "325deg 72deg 70%"],
            [1.00, "340deg 74deg 40%"],
        ],
        "captions": [
            {"from": 0.03, "to": 0.22, "pos": "left",   "eyebrow": "Gallery I, 1970s",         "line": "Marcello Gandini drew a wedge and the genre rewrote itself."},
            {"from": 0.22, "to": 0.45, "pos": "right",  "eyebrow": "Side profile",              "line": "No curve without intention. No surface without a reason."},
            {"from": 0.45, "to": 0.68, "pos": "bottom", "eyebrow": "Road and Track, Feb 1976", "line": "“The fastest car we have ever tested.”"},
            {"from": 0.68, "to": 0.78, "pos": "right",  "eyebrow": "Scissor door",              "line": "An idea so strange that every supercar since has tried to inherit it."},
        ],
        "finaleTitle": "The scissor door opens onto the 1980s.",
        "doorRig": {
            "match": r"SK_Door_FL",
            "axis": "x",
            "hingeOn": "zmax",
            "maxRadians": 1.25,
            "startProgress": 0.86,
        },
    },
    "959": {
        "keyframes": [
            [0.00, "20deg 82deg 108%"],
            [0.22, "80deg 92deg 82%"],
            [0.45, "160deg 80deg 110%"],
            [0.68, "225deg 75deg 95%"],
            [0.88, "320deg 80deg 58%"],
            [1.00, "335deg 78deg 32%"],
        ],
        "captions": [
            {"from": 0.03, "to": 0.22, "pos": "left",   "eyebrow": "Gallery II, 1980s",        "line": "Porsche built the 959 for a rally championship that was cancelled before it raced."},
            {"from": 0.22, "to": 0.45, "pos": "bottom", "eyebrow": "Magnesium wheel",          "line": "Every spoke hollowed. Every gram accounted for."},
            {"from": 0.45, "to": 0.68, "pos": "right",  "eyebrow": "Twin-turbo flat-six",      "line": "All-wheel drive before the world was ready to ask for it."},
            {"from": 0.68, "to": 0.78, "pos": "left",   "eyebrow": "Car and Driver, 1987",     "line": "“The word perfect was difficult to avoid.”"},
        ],
        "finaleTitle": "From Weissach to Woking. The 1990s are waiting.",
        "materialOverrides": [
            {"match": r"body|paint|lack|carrosserie|exterior|shell|karosserie", "color": [0.55, 0.012, 0.016, 1.0], "metallic": 0.85, "roughness": 0.28},
        ],
        # 959 body is one unified mesh, doors can't be separated without Blender work.
    },
    "f1": {
        "keyframes": [
            [0.00, "40deg 88deg 115%"],
            [0.22, "110deg 82deg 95%"],
            [0.45, "190deg 85deg 105%"],
            [0.68, "260deg 78deg 95%"],
            [0.88, "30deg 68deg 55%"],
            [1.00, "25deg 60deg 28%"],
        ],
        "captions": [
            {"from": 0.03, "to": 0.22, "pos": "left",   "eyebrow": "Gallery III, 1990s",       "line": "Gordon Murray asked what a perfect driver’s car would be. Then refused to compromise."},
            {"from": 0.22, "to": 0.45, "pos": "right",  "eyebrow": "Carbon monocoque",         "line": "The first road car built like a Formula 1 chassis."},
            {"from": 0.45, "to": 0.68, "pos": "bottom", "eyebrow": "Autocar, 1994",            "line": "“You slide in. The driver sits dead center. Everything else is geometry.”"},
            {"from": 0.68, "to": 0.78, "pos": "left",   "eyebrow": "240.1 mph",                "line": "A production car record that stood for over a decade."},
        ],
        "finaleTitle": "Analog perfection hands off to the digital thousand.",
        "materialOverrides": [
            # Rear tail-light lenses to deep red, sRGB ~#9A0A0A
            {"match": r"tail|taillight|rear.?light|brake.?light|rearlamp|lamp.*rear", "color": [0.36, 0.005, 0.005, 1.0], "metallic": 0.0, "roughness": 0.35},
        ],
    },
    "veyron": {
        "keyframes": [
            [0.00, "15deg 82deg 112%"],
            [0.22, "90deg 90deg 85%"],
            [0.45, "180deg 82deg 115%"],
            [0.68, "215deg 72deg 85%"],
            [0.88, "325deg 78deg 55%"],
            [1.00, "335deg 74deg 30%"],
        ],
        "captions": [
            {"from": 0.03, "to": 0.22, "pos": "left",   "eyebrow": "Gallery IV, 2000s",         "line": "Volkswagen Group handed Bugatti a specification that physics had to catch up to."},
            {"from": 0.22, "to": 0.45, "pos": "right",  "eyebrow": "Eight liters, sixteen cylinders", "line": "Quad-turbo. Ten radiators. A drivetrain designed to survive itself."},
            {"from": 0.45, "to": 0.68, "pos": "bottom", "eyebrow": "Michelin and Brembo",       "line": "Tires rated for fifteen minutes at full speed. Then replace."},
            {"from": 0.68, "to": 0.78, "pos": "left",   "eyebrow": "Autocar, 2005",             "line": "“A car that, in motion, felt almost calm despite its statistics.”"},
        ],
        "finaleTitle": "1,001 horsepower. The decade closes at 253 mph.",
        "doorRig": {
            "match": r"doorLF",
            "axis": "y",
            "hingeOn": "zmax",
            "maxRadians": 1.1,
            "startProgress": 0.86,
        },
    },
}

URL_RE = re.compile(r"(https?://[^\s),]+)")
ITAL_RE = re.compile(r"\*([^*]+)\*")


def normalize(text: str) -> str:
    return text.replace(" — ", ", ").replace("—", ",")


def caption_clean(raw: str) -> str:
    """Strip trailing URL from a citation string and remove em-dashes."""
    raw = normalize(raw)
    raw = re.sub(r",?\s*https?://\S+?\.?\s*$", "", raw.rstrip())
    raw = raw.rstrip(",. ")
    return raw + "."


def resolve_filename(img_dir: Path, filename: str) -> str | None:
    """Return the actual filename present in `img_dir`. A previous build step
    converted all artifact JPGs to WebP without updating sources.json, so the
    builder accepts either extension transparently. Returns None if nothing
    with the stem exists."""
    if (img_dir / filename).exists():
        return filename
    stem = Path(filename).stem
    for ext in (".webp", ".jpg", ".jpeg", ".png"):
        candidate = stem + ext
        if (img_dir / candidate).exists():
            return candidate
    return None


def source_page_for(entry) -> str:
    sp = entry.get("source_page")
    if sp:
        return sp
    wt = entry.get("wikimedia_title")
    if wt:
        return "https://commons.wikimedia.org/wiki/" + wt.replace(" ", "_")
    return entry.get("source_url", "")


def load_json(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def short_footnote_from_citation(citation: str) -> str:
    """Derive a Chicago short-form footnote from a full chicago_citation.
    Keep through the first quoted title if present, else through the first
    two comma-separated clauses. Strip trailing URL and licensing text. """
    s = normalize(citation).rstrip(" .")
    s = re.sub(r",?\s*https?://\S+", "", s)
    # If a "Title," exists in double quotes, keep "Author, "Title.""
    m = re.match(r'^([^,]+,\s*"[^"]+")', s)
    if m:
        return m.group(1).rstrip(",") + "."
    # Otherwise keep author + primary descriptor (first two commas).
    parts = [p.strip() for p in s.split(",")]
    keep = parts[:2] if len(parts) >= 2 else parts[:1]
    return ", ".join(keep).rstrip(",. ") + "."


def tier4_to_entry(raw: dict) -> dict:
    """Normalize a sourcing-pass-apr-2026 item onto the same shape Tier 1/2 use
    so the rest of the pipeline is category-agnostic."""
    citation = raw.get("chicago_citation", "")
    return {
        "filename": raw["filename"],
        "category": raw.get("category", "misc"),
        "source_url": raw.get("source_url", raw.get("source_page", "")),
        "source_page": raw.get("source_page", raw.get("source_url", "")),
        "description": raw.get("what_it_depicts", ""),
        "license": raw.get("licensing", ""),
        "chicago_caption": citation,
        "chicago_bibliography": citation,
        "chicago_footnote_short": short_footnote_from_citation(citation),
        # Passthrough for downstream debug:
        "_tier": 4,
        "_raw": raw,
    }


def copy_tier4_files(car_img_dir: str, items: list) -> list:
    """Copy Tier 4 files into public/artifacts/<img_dir>/. First-wins on name
    collision (do not overwrite Tier 1/2 assets). Returns items whose file is
    present in public after the copy."""
    src_dir = PS / "sourcing-pass-apr-2026" / car_img_dir
    dst_dir = PUBLIC / car_img_dir
    dst_dir.mkdir(parents=True, exist_ok=True)
    kept = []
    for e in items:
        src = src_dir / e["filename"]
        dst = dst_dir / e["filename"]
        if not src.exists():
            continue
        if not dst.exists():
            shutil.copy2(src, dst)
        kept.append(e)
    return kept


def build():
    tier1 = load_json(PS / "from-main-sources" / "sources.json")
    per_car = {c["slug"]: load_json(PS / c["t2_dir"] / "sources.json") for c in CARS}
    tier4 = {}
    for c in CARS:
        p = PS / "sourcing-pass-apr-2026" / c["t4_dir"] / "sources.json"
        tier4[c["slug"]] = load_json(p) if p.exists() else {"items": []}

    # Assemble car records
    car_records = {}
    all_bib = set()
    missing_fields_report = []  # (car, filename, missing_keys)
    for pc in per_car.values():
        all_bib.add(normalize(pc["primary_written_source"]["chicago_bibliography"]))

    from collections import defaultdict

    for car in CARS:
        slug = car["slug"]
        pc = per_car[slug]
        t1 = tier1["folders"][car["t1_key"]]

        # Tier 1 split
        t1_primary, t1_secondary = [], []
        for section_key, entries in t1.items():
            target = t1_primary if section_key.startswith("primary") else t1_secondary
            for e in entries:
                target.append(e)

        img_dir = ROOT / "public" / "artifacts" / car["img_dir"]

        def with_resolved(e):
            """Return a shallow copy of the entry with `filename` updated to
            whatever actually exists in public/. None if no file found."""
            resolved = resolve_filename(img_dir, e["filename"])
            if not resolved:
                return None
            if resolved == e["filename"]:
                return e
            e2 = dict(e)
            e2["filename"] = resolved
            return e2

        # Tier 2: skip entries archived as weak specimens or already in Tier 1.
        t1_source_urls = {e.get("source_url") for e in (t1_primary + t1_secondary)}
        t2_available = []
        for e in pc.get("image_primary_sources", []):
            if e.get("current_location", "").startswith("_archive-weak-specimens"):
                continue  # Tier 3
            if e.get("source_url") in t1_source_urls:
                continue
            resolved = with_resolved(e)
            if resolved:
                t2_available.append(resolved)

        # Tier 4: copy files in, normalize schema to tier-1/2 shape.
        t4_raw = tier4[slug].get("items", [])
        t4_normalized = [tier4_to_entry(r) for r in t4_raw]
        t4_copied = copy_tier4_files(car["img_dir"], t4_normalized)
        # Dedupe only by filename (prompt's first-wins rule). Two figures
        # citing the same source URL are legitimately distinct artifacts
        # (different page scans, different crops, different framings).
        used_filenames = {e["filename"] for e in t1_primary + t1_secondary + t2_available}
        t4_kept = []
        for e in t4_copied:
            if e["filename"] in used_filenames:
                continue
            t4_kept.append(e)

        # Tier 1: resolve .jpg → .webp fallback so the WebP conversion pass
        # doesn't silently drop the primary sources.
        t1_primary = [r for r in (with_resolved(e) for e in t1_primary) if r]
        t1_secondary = [r for r in (with_resolved(e) for e in t1_secondary) if r]

        figs = []
        fig_id = 0
        fn_id = 1  # footnote 1 is primary_written_source

        def push(entries, section_title, tier_label):
            nonlocal fig_id, fn_id
            if not entries:
                return
            figs.append({"_sectionHeader": section_title, "_tierLabel": tier_label})
            for e in entries:
                fig_id += 1
                fn_id += 1
                # Flag incomplete entries so the operator can patch sources.json.
                missing = [k for k in ("chicago_caption", "chicago_bibliography", "chicago_footnote_short")
                           if not e.get(k)]
                if missing:
                    missing_fields_report.append((slug, e["filename"], missing))
                figs.append({
                    "figId": fig_id,
                    "footnoteN": fn_id,
                    "filename": e["filename"],
                    "alt": normalize(e.get("description", e["filename"])),
                    "blurb": normalize(e.get("description", "")),
                    "caption": caption_clean(e.get("chicago_caption") or e.get("chicago_bibliography") or ""),
                    "license": normalize(e.get("license", "")),
                    "sourceLink": source_page_for(e),
                    "footnote": normalize(e.get("chicago_footnote_short") or ""),
                    # Used for Ibid. collapsing and nothing else — not emitted.
                    "_sourceKey": (e.get("source_page") or e.get("source_url") or e["filename"]).split("#")[0],
                })
                bib = e.get("chicago_bibliography") or e.get("chicago_caption") or ""
                if bib:
                    all_bib.add(normalize(bib))

        push(t1_primary, "Primary Source Artifacts", "Tier 1 · Primary")
        push(t1_secondary, "Secondary Source Artifacts", "Tier 1 · Secondary")

        # Merge Tier 2 + Tier 4 by category, then emit sections in canonical order.
        by_cat = defaultdict(list)
        for e in t2_available:
            by_cat[e.get("category", "misc")].append(e)
        for e in t4_kept:
            by_cat[e.get("category", "misc")].append(e)

        for section_title, cat_keys in SECTION_ORDER:
            bucket = []
            for ck in cat_keys:
                bucket.extend(by_cat.get(ck, []))
            if bucket:
                push(bucket, section_title, "Tier 2 + 4")

        # Ibid. pass — Chicago: immediate repeat of the same source collapses
        # to "Ibid." The primary_written_source is footnote 1; figures start at 2.
        footnotes = [normalize(pc["primary_written_source"]["chicago_footnote_short"])]
        prev_key = None
        for item in figs:
            if "footnote" not in item:
                continue
            key = item["_sourceKey"]
            if prev_key is not None and key == prev_key:
                footnotes.append("Ibid.")
            else:
                footnotes.append(item["footnote"])
            prev_key = key

        # Strip private keys before emission.
        for item in figs:
            item.pop("_sourceKey", None)

        car_records[slug] = {
            "primarySource": {
                "bibliography": normalize(pc["primary_written_source"]["chicago_bibliography"]),
                "citation": normalize(pc["primary_written_source"]["citation"]),
            },
            "artifacts": figs,
            "footnotes": footnotes,
            "imgDir": car["img_dir"],
        }

    # Include all tier-1, tier-2, tier-4 biblios (regardless of per-car file presence).
    for decade_key, folder_obj in tier1["folders"].items():
        for section_key, entries in folder_obj.items():
            for e in entries:
                all_bib.add(normalize(e["chicago_bibliography"]))
    for pc in per_car.values():
        for e in pc.get("image_primary_sources", []):
            if e.get("current_location", "").startswith("_archive-weak-specimens"):
                continue
            all_bib.add(normalize(e["chicago_bibliography"]))
    for slug, t4 in tier4.items():
        for e in t4.get("items", []):
            if e.get("chicago_citation"):
                all_bib.add(normalize(e["chicago_citation"]))

    def sort_key(s):
        return re.sub(r'^[\s"\*\[]+', "", s).lower()
    sorted_bib = sorted(all_bib, key=sort_key)

    # Emit TS files
    ts_artifacts = build_artifacts_ts(car_records)
    ts_scenes = build_scenes_ts()
    ts_bib = build_bib_ts(sorted_bib)

    (LIB / "artifacts.ts").write_text(ts_artifacts, encoding="utf-8")
    (LIB / "scenes.ts").write_text(ts_scenes, encoding="utf-8")
    (LIB / "bibliography.ts").write_text(ts_bib, encoding="utf-8")

    # Build changelog with tier + footnote short-form columns per prompt spec.
    rows = []
    per_page_counts = defaultdict(int)
    broken_srcs = []
    for slug, rec in car_records.items():
        for item in rec["artifacts"]:
            if "figId" not in item:
                continue
            per_page_counts[slug] += 1
            # Resolve tier from the section header that preceded this figure.
            # (Simple: find nearest prior _sectionHeader in rec["artifacts"].)
            tier = ""
            for prior in reversed(rec["artifacts"][:rec["artifacts"].index(item)]):
                if "_tierLabel" in prior:
                    tier = prior["_tierLabel"]
                    break
            rows.append({
                "figId": item["figId"],
                "slug": slug,
                "tier": tier,
                "filename": item["filename"],
                "footnote": item["footnote"],
                "sourceLink": item["sourceLink"],
            })
            # Verify img_src resolves on disk.
            if not (PUBLIC / rec["imgDir"] / item["filename"]).exists():
                broken_srcs.append((slug, item["filename"]))

    rows.sort(key=lambda r: (r["slug"], r["figId"]))
    with open(ROOT / "SOURCES_CHANGELOG.md", "w", encoding="utf-8") as f:
        f.write("# SOURCES_CHANGELOG\n\n")
        f.write("Primary-source images wired into the Next.js exhibit. Served from `public/artifacts/<car>/`.\n\n")
        f.write("## Figure inventory\n\n")
        f.write("| Figure ID | Gallery Page | Tier | Filename | Chicago Short Footnote | Source Page URL |\n")
        f.write("| --- | --- | --- | --- | --- | --- |\n")
        for r in rows:
            fn = r["footnote"].replace("|", "\\|")
            src = r["sourceLink"].replace("|", "\\|")
            f.write(f"| {r['figId']} | `/{r['slug']}` | {r['tier']} | `{r['filename']}` | {fn} | {src} |\n")
        f.write("\n## Summary\n\n")
        for c in CARS:
            f.write(f"- `/{c['slug']}`: {per_page_counts[c['slug']]} figures\n")
        f.write(f"- Total figures: {len(rows)}\n")
        f.write(f"- Bibliography entries: {len(sorted_bib)}\n")
        if broken_srcs:
            f.write("\n## Unresolved image paths\n\n")
            for slug, fn in broken_srcs:
                f.write(f"- `/{slug}`: `{fn}`\n")
        if missing_fields_report:
            f.write("\n## Entries missing Chicago fields (fill in sources.json)\n\n")
            for slug, fn, keys in missing_fields_report:
                f.write(f"- `/{slug}` `{fn}` — missing: {', '.join(keys)}\n")

    print(f"[ok] wrote {len(rows)} figure rows, {len(sorted_bib)} bibliography entries")
    for c in CARS:
        print(f"  /{c['slug']}: {per_page_counts[c['slug']]} figures")
    if broken_srcs:
        print(f"[warn] {len(broken_srcs)} broken image paths (see SOURCES_CHANGELOG.md)")
    if missing_fields_report:
        print(f"[warn] {len(missing_fields_report)} entries missing Chicago fields (see SOURCES_CHANGELOG.md)")


def ts_string(s):
    # Use JSON-style quoting to escape special chars safely
    return json.dumps(s, ensure_ascii=False)


def build_artifacts_ts(records):
    out = [
        "// AUTO-GENERATED by _build_nextjs_data.py. Do not edit by hand.\n",
        "// Regenerate after editing primary-sources/*/sources.json.\n\n",
        "export type ArtifactSectionHeader = {\n",
        "  kind: \"section\";\n",
        "  title: string;\n",
        "  tierLabel: string;\n",
        "};\n\n",
        "export type ArtifactFigure = {\n",
        "  kind: \"figure\";\n",
        "  figId: number;\n",
        "  footnoteN: number;\n",
        "  filename: string;\n",
        "  alt: string;\n",
        "  blurb: string;\n",
        "  caption: string;\n",
        "  license: string;\n",
        "  sourceLink: string;\n",
        "  footnote: string;\n",
        "};\n\n",
        "export type ArtifactItem = ArtifactSectionHeader | ArtifactFigure;\n\n",
        "export type CarArtifacts = {\n",
        "  primarySource: { bibliography: string; citation: string };\n",
        "  imgDir: string;\n",
        "  artifacts: ArtifactItem[];\n",
        "  footnotes: string[];\n",
        "};\n\n",
        "export const artifactsBySlug: Record<string, CarArtifacts> = {\n",
    ]
    for slug, rec in records.items():
        out.append(f"  {ts_string(slug)}: {{\n")
        ps = rec["primarySource"]
        out.append("    primarySource: {\n")
        out.append(f"      bibliography: {ts_string(ps['bibliography'])},\n")
        out.append(f"      citation: {ts_string(ps['citation'])},\n")
        out.append("    },\n")
        out.append(f"    imgDir: {ts_string(rec['imgDir'])},\n")
        out.append("    artifacts: [\n")
        for item in rec["artifacts"]:
            if "_sectionHeader" in item:
                out.append(
                    "      { kind: \"section\", title: "
                    + ts_string(item["_sectionHeader"])
                    + ", tierLabel: "
                    + ts_string(item["_tierLabel"])
                    + " },\n"
                )
            else:
                out.append("      {\n")
                out.append("        kind: \"figure\",\n")
                for k in ["figId", "footnoteN"]:
                    out.append(f"        {k}: {item[k]},\n")
                for k in ["filename", "alt", "blurb", "caption", "license", "sourceLink", "footnote"]:
                    out.append(f"        {k}: {ts_string(item[k])},\n")
                out.append("      },\n")
        out.append("    ],\n")
        out.append("    footnotes: [\n")
        for fn in rec["footnotes"]:
            out.append(f"      {ts_string(fn)},\n")
        out.append("    ],\n")
        out.append("  },\n")
    out.append("};\n")
    return "".join(out)


def build_scenes_ts():
    out = [
        "// AUTO-GENERATED by _build_nextjs_data.py.\n",
        "// Scroll-scene camera keyframes, captions, and per-car material overrides.\n\n",
        "export type SceneKeyframe = [progress: number, orbit: string];\n",
        "export type SceneCaption = {\n",
        "  from: number;\n",
        "  to: number;\n",
        "  pos: \"left\" | \"right\" | \"bottom\";\n",
        "  eyebrow: string;\n",
        "  line: string;\n",
        "};\n",
        "export type MaterialOverride = {\n",
        "  /** Case-insensitive regex source matched against material.name. */\n",
        "  match: string;\n",
        "  /** RGBA in 0..1 linear space. */\n",
        "  color: [number, number, number, number];\n",
        "  metallic?: number;\n",
        "  roughness?: number;\n",
        "};\n",
        "export type DoorRig = {\n",
        "  /** Case-insensitive regex matching door node names. */\n",
        "  match: string;\n",
        "  /** Axis of rotation on the hinge pivot. */\n",
        "  axis: \"x\" | \"y\" | \"z\";\n",
        "  /** Which face of the door bounding box to treat as the hinge edge. */\n",
        "  hingeOn: \"xmin\" | \"xmax\" | \"ymin\" | \"ymax\" | \"zmin\" | \"zmax\";\n",
        "  /** Rotation at progress=1, in radians. */\n",
        "  maxRadians: number;\n",
        "  /** Scroll progress at which the door starts opening. */\n",
        "  startProgress: number;\n",
        "};\n",
        "export type SceneConfig = {\n",
        "  keyframes: SceneKeyframe[];\n",
        "  captions: SceneCaption[];\n",
        "  finaleTitle: string;\n",
        "  materialOverrides?: MaterialOverride[];\n",
        "  doorRig?: DoorRig;\n",
        "};\n\n",
        "export const scenesBySlug: Record<string, SceneConfig> = {\n",
    ]
    for slug, cfg in SCENES.items():
        out.append(f"  {ts_string(slug)}: {{\n")
        out.append("    keyframes: [\n")
        for p, orbit in cfg["keyframes"]:
            out.append(f"      [{p}, {ts_string(orbit)}],\n")
        out.append("    ],\n")
        out.append("    captions: [\n")
        for c in cfg["captions"]:
            out.append(
                "      { from: "
                + f"{c['from']}, to: {c['to']}, pos: {ts_string(c['pos'])}, "
                + f"eyebrow: {ts_string(c['eyebrow'])}, line: {ts_string(c['line'])} }},\n"
            )
        out.append("    ],\n")
        out.append(f"    finaleTitle: {ts_string(cfg['finaleTitle'])},\n")
        if cfg.get("materialOverrides"):
            out.append("    materialOverrides: [\n")
            for ov in cfg["materialOverrides"]:
                parts = [
                    f"match: {ts_string(ov['match'])}",
                    f"color: [{', '.join(str(v) for v in ov['color'])}]",
                ]
                if "metallic" in ov:
                    parts.append(f"metallic: {ov['metallic']}")
                if "roughness" in ov:
                    parts.append(f"roughness: {ov['roughness']}")
                out.append(f"      {{ {', '.join(parts)} }},\n")
            out.append("    ],\n")
        if cfg.get("doorRig"):
            dr = cfg["doorRig"]
            out.append("    doorRig: {\n")
            out.append(f"      match: {ts_string(dr['match'])},\n")
            out.append(f"      axis: {ts_string(dr['axis'])},\n")
            out.append(f"      hingeOn: {ts_string(dr['hingeOn'])},\n")
            out.append(f"      maxRadians: {dr['maxRadians']},\n")
            out.append(f"      startProgress: {dr['startProgress']},\n")
            out.append("    },\n")
        out.append("  },\n")
    out.append("};\n")
    return "".join(out)


def build_bib_ts(entries):
    out = [
        "// AUTO-GENERATED by _build_nextjs_data.py.\n",
        "// Consolidated primary-source bibliography across all four cars.\n\n",
        "export const bibliography: string[] = [\n",
    ]
    for b in entries:
        out.append(f"  {ts_string(b)},\n")
    out.append("];\n")
    return "".join(out)


if __name__ == "__main__":
    build()
