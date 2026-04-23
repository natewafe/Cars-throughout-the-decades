#!/usr/bin/env python3
"""Generate src/lib/artifacts.ts (figure + footnote data per car) and
src/lib/scenes.ts (scroll-scene keyframes + captions per car) from the
primary-sources JSONs."""

import json, re, os
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PS = ROOT / "primary-sources"
LIB = ROOT / "src" / "lib"
LIB.mkdir(parents=True, exist_ok=True)

# Map gallery slug to: folder keys used across the two tiers + the Next.js car slug
CARS = [
    {"slug": "countach",    "t2_dir": "countach",    "t1_key": "1970s-countach",    "img_dir": "countach"},
    {"slug": "959",         "t2_dir": "porsche-959", "t1_key": "1980s-porsche-959", "img_dir": "porsche-959"},
    {"slug": "f1",          "t2_dir": "mclaren-f1",  "t1_key": "1990s-mclaren-f1",  "img_dir": "mclaren-f1"},
    {"slug": "veyron",      "t2_dir": "veyron",      "t1_key": "2000s-veyron",      "img_dir": "veyron"},
]

CATEGORY_SECTIONS = [
    ("magazine",        "Magazine & Press Coverage"),
    ("celebrity-owner", "Designers, Builders, and Owners"),
    ("schematics",      "Design & Engineering"),
    ("press-launch",    "Launch & Motor Shows"),
]

# Scroll-scene camera keyframes and captions per car (ported from legacy/scroll-scene injection)
SCENES = {
    "countach": {
        "keyframes": [
            [0.00, "25deg 78deg 140%"],
            [0.22, "90deg 88deg 100%"],
            [0.45, "180deg 80deg 115%"],
            [0.68, "275deg 76deg 95%"],
            [0.88, "330deg 70deg 55%"],
            [1.00, "340deg 72deg 30%"],
        ],
        "captions": [
            {"from": 0.03, "to": 0.22, "pos": "left",   "eyebrow": "Gallery I, 1970s",         "line": "Marcello Gandini drew a wedge and the genre rewrote itself."},
            {"from": 0.22, "to": 0.45, "pos": "right",  "eyebrow": "Side profile",              "line": "No curve without intention. No surface without a reason."},
            {"from": 0.45, "to": 0.68, "pos": "bottom", "eyebrow": "Road and Track, Feb 1976", "line": "“The fastest car we have ever tested.”"},
            {"from": 0.68, "to": 0.86, "pos": "right",  "eyebrow": "Scissor door",              "line": "An idea so strange that every supercar since has tried to inherit it."},
        ],
        "finaleTitle": "The scissor door opens onto the 1980s.",
    },
    "959": {
        "keyframes": [
            [0.00, "20deg 82deg 140%"],
            [0.22, "80deg 92deg 90%"],
            [0.45, "160deg 80deg 110%"],
            [0.68, "225deg 75deg 95%"],
            [0.88, "320deg 80deg 58%"],
            [1.00, "335deg 78deg 32%"],
        ],
        "captions": [
            {"from": 0.03, "to": 0.22, "pos": "left",   "eyebrow": "Gallery II, 1980s",        "line": "Porsche built the 959 for a rally championship that was cancelled before it raced."},
            {"from": 0.22, "to": 0.45, "pos": "bottom", "eyebrow": "Magnesium wheel",          "line": "Every spoke hollowed. Every gram accounted for."},
            {"from": 0.45, "to": 0.68, "pos": "right",  "eyebrow": "Twin-turbo flat-six",      "line": "All-wheel drive before the world was ready to ask for it."},
            {"from": 0.68, "to": 0.86, "pos": "left",   "eyebrow": "Car and Driver, 1987",     "line": "“The word perfect was difficult to avoid.”"},
        ],
        "finaleTitle": "From Weissach to Woking. The 1990s are waiting.",
        "materialOverrides": [
            # Guards-red paint, sRGB ~#C0171F -> linear [0.55, 0.012, 0.016]
            {"match": r"body|paint|lack|carrosserie|exterior|shell|karosserie", "color": [0.55, 0.012, 0.016, 1.0], "metallic": 0.85, "roughness": 0.28},
        ],
    },
    "f1": {
        "keyframes": [
            [0.00, "40deg 88deg 150%"],
            [0.22, "110deg 82deg 110%"],
            [0.45, "190deg 85deg 105%"],
            [0.68, "260deg 78deg 95%"],
            [0.88, "30deg 68deg 55%"],
            [1.00, "25deg 60deg 28%"],
        ],
        "captions": [
            {"from": 0.03, "to": 0.22, "pos": "left",   "eyebrow": "Gallery III, 1990s",       "line": "Gordon Murray asked what a perfect driver’s car would be. Then refused to compromise."},
            {"from": 0.22, "to": 0.45, "pos": "right",  "eyebrow": "Carbon monocoque",         "line": "The first road car built like a Formula 1 chassis."},
            {"from": 0.45, "to": 0.68, "pos": "bottom", "eyebrow": "Autocar, 1994",            "line": "“You slide in. The driver sits dead center. Everything else is geometry.”"},
            {"from": 0.68, "to": 0.86, "pos": "left",   "eyebrow": "240.1 mph",                "line": "A production car record that stood for over a decade."},
        ],
        "finaleTitle": "Analog perfection hands off to the digital thousand.",
        "materialOverrides": [
            # Rear tail-light lenses to deep red, sRGB ~#9A0A0A
            {"match": r"tail|taillight|rear.?light|brake.?light|rearlamp|lamp.*rear", "color": [0.36, 0.005, 0.005, 1.0], "metallic": 0.0, "roughness": 0.35},
        ],
    },
    "veyron": {
        "keyframes": [
            [0.00, "15deg 82deg 145%"],
            [0.22, "90deg 90deg 95%"],
            [0.45, "180deg 82deg 115%"],
            [0.68, "215deg 72deg 85%"],
            [0.88, "325deg 78deg 55%"],
            [1.00, "335deg 74deg 30%"],
        ],
        "captions": [
            {"from": 0.03, "to": 0.22, "pos": "left",   "eyebrow": "Gallery IV, 2000s",         "line": "Volkswagen Group handed Bugatti a specification that physics had to catch up to."},
            {"from": 0.22, "to": 0.45, "pos": "right",  "eyebrow": "Eight liters, sixteen cylinders", "line": "Quad-turbo. Ten radiators. A drivetrain designed to survive itself."},
            {"from": 0.45, "to": 0.68, "pos": "bottom", "eyebrow": "Michelin and Brembo",       "line": "Tires rated for fifteen minutes at full speed. Then replace."},
            {"from": 0.68, "to": 0.86, "pos": "left",   "eyebrow": "Autocar, 2005",             "line": "“A car that, in motion, felt almost calm despite its statistics.”"},
        ],
        "finaleTitle": "1,001 horsepower. The decade closes at 253 mph.",
    },
}

URL_RE = re.compile(r"(https?://[^\s),]+)")
ITAL_RE = re.compile(r"\*([^*]+)\*")


def normalize(text: str) -> str:
    return text.replace(" — ", ", ").replace("—", ",")


def caption_clean(raw: str) -> str:
    """Strip trailing URL from chicago_caption and remove em-dashes."""
    raw = normalize(raw)
    raw = re.sub(r",?\s*https?://\S+?\.?\s*$", "", raw.rstrip())
    raw = raw.rstrip(",. ")
    return raw + "."


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


def build():
    tier1 = load_json(PS / "from-main-sources" / "sources.json")
    per_car = {c["slug"]: load_json(PS / c["t2_dir"] / "sources.json") for c in CARS}

    # Assemble car records
    car_records = {}
    all_bib = set()
    for pc in per_car.values():
        all_bib.add(normalize(pc["primary_written_source"]["chicago_bibliography"]))

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

        t1_source_urls = {e.get("source_url") for e in (t1_primary + t1_secondary)}

        # Tier 2: dedupe by source_url and check file presence
        img_dir = ROOT / "public" / "artifacts" / car["img_dir"]
        t2_available = []
        for e in pc.get("image_primary_sources", []):
            if e.get("source_url") in t1_source_urls:
                continue
            if (img_dir / e["filename"]).exists():
                t2_available.append(e)

        # All tier-1 entries have files (verified earlier in legacy build). Filter anyway.
        t1_primary = [e for e in t1_primary if (img_dir / e["filename"]).exists()]
        t1_secondary = [e for e in t1_secondary if (img_dir / e["filename"]).exists()]

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
                figs.append({
                    "figId": fig_id,
                    "footnoteN": fn_id,
                    "filename": e["filename"],
                    "alt": normalize(e.get("description", e["filename"])),
                    "caption": caption_clean(e["chicago_caption"]),
                    "license": normalize(e.get("license", "")),
                    "sourceLink": source_page_for(e),
                    "footnote": normalize(e["chicago_footnote_short"]),
                })
                all_bib.add(normalize(e["chicago_bibliography"]))

        push(t1_primary, "Primary Source Artifacts", "Tier 1 · Primary")
        push(t1_secondary, "Secondary Source Artifacts", "Tier 1 · Secondary")

        # Tier 2 grouped
        from collections import defaultdict
        by_cat = defaultdict(list)
        for e in t2_available:
            by_cat[e.get("category", "misc")].append(e)
        for cat_key, cat_title in CATEGORY_SECTIONS:
            if cat_key in by_cat:
                push(by_cat[cat_key], cat_title, f"Tier 2 · {cat_key}")

        footnotes = [normalize(pc["primary_written_source"]["chicago_footnote_short"])]
        for item in figs:
            if "footnote" in item:
                footnotes.append(item["footnote"])

        car_records[slug] = {
            "primarySource": {
                "bibliography": normalize(pc["primary_written_source"]["chicago_bibliography"]),
                "citation": normalize(pc["primary_written_source"]["citation"]),
            },
            "artifacts": figs,
            "footnotes": footnotes,
            "imgDir": car["img_dir"],
        }

    # Include all tier-1 + all tier-2 biblios regardless of file presence
    for decade_key, folder_obj in tier1["folders"].items():
        for section_key, entries in folder_obj.items():
            for e in entries:
                all_bib.add(normalize(e["chicago_bibliography"]))
    for pc in per_car.values():
        for e in pc.get("image_primary_sources", []):
            all_bib.add(normalize(e["chicago_bibliography"]))

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

    # Build changelog (regenerated for Next.js paths)
    rows = []
    for slug, rec in car_records.items():
        for item in rec["artifacts"]:
            if "figId" in item:
                rows.append((item["filename"], slug, item["figId"]))
    rows.sort(key=lambda r: (r[1], r[2]))
    with open(ROOT / "SOURCES_CHANGELOG.md", "w", encoding="utf-8") as f:
        f.write("# SOURCES_CHANGELOG\n\n")
        f.write("Primary-source images wired into the Next.js exhibit. Served from `public/artifacts/<car>/`.\n\n")
        f.write("| Filename | Car route | Figure # |\n")
        f.write("| --- | --- | --- |\n")
        for (fname, slug, fig_num) in rows:
            f.write(f"| `{fname}` | `/{slug}` | {fig_num} |\n")

    print(f"[ok] wrote {len(rows)} figure rows, {len(sorted_bib)} bibliography entries")


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
                for k in ["filename", "alt", "caption", "license", "sourceLink", "footnote"]:
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
        "export type SceneConfig = {\n",
        "  keyframes: SceneKeyframe[];\n",
        "  captions: SceneCaption[];\n",
        "  finaleTitle: string;\n",
        "  materialOverrides?: MaterialOverride[];\n",
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
