# Velocity & Vision — Primary Source Manifest

Curated library of first-party image sources for the four gallery pages of the Velocity & Vision Virtual Museum (UTK history class).

## PRIORITY STRUCTURE

There are three tiers of material. **Always reach for Tier 1 first**; it comes straight from the student's annotated bibliography and is the citation backbone of the exhibit.

### Tier 1 — `from-main-sources/` (PRIORITY, use these first)

Images pulled directly from the 8 sources cited in the student's annotated bibliography. Sorted by decade, then car, then primary/secondary.

```
from-main-sources/
├── sources.json                                   (master manifest for this tier)
├── 1970s-countach/
│   ├── primary-road-and-track-feb-1976/           (2 page scans)
│   └── secondary-perkins-the-drive/               (7 article images)
├── 1980s-porsche-959/
│   ├── primary-csere-car-and-driver-1987/         (2 test photos)
│   └── secondary-kimble-motorsport-cutaway/       (1 cutaway — the David Kimble illustration)
├── 1990s-mclaren-f1/
│   ├── primary-cropley-autocar-may-1994/          (6 editorial photos)
│   └── secondary-car-magazine-june-1994/          (1 cover + 3 spread scans)
└── 2000s-veyron/
    ├── primary-cropley-autocar-2005/              (6 editorial photos)
    └── secondary-autocar-veyron-2005-2015-review/ (2 retrospective photos)
```

29 artifacts, each with a full Chicago citation pre-written in `from-main-sources/sources.json` under `folders` keyed by decade-car and then by subfolder name. Every entry carries `chicago_caption`, `chicago_bibliography`, `chicago_footnote_short`, creator, year, license note, and the source page URL.

### Tier 2 — per-car folders (`countach/`, `porsche-959/`, `mclaren-f1/`, `veyron/`)

Supplementary period artifacts and specimen photographs organized by the four museum categories (magazine, celebrity-owner, schematics, press-launch). Use when a Tier 1 artifact does not cover a particular category.

Each car folder has its own `sources.json` with full Chicago citations.

- `countach/` — 9 active items (R&T scans, Pirelli 1986 poster, Walter Wolf, Wolf of Wall Street RM Sotheby's, Gandini, Bertone, LP500 prototype)
- `porsche-959/` — 10 active items (1983 Gruppe B factory press, Ralph Lauren's 959, factory mechanical sketch, engine, Rothmans Paris-Dakar, Porsche 961)
- `mclaren-f1/` — 15 active items (Car Magazine June 1994 scans, Elon Musk delivery 1999, Gordon Murray, F1 GTR 1995 Le Mans winner, V12 engine bay)
- `veyron/` — 12 active items (Bugatti chassis 5.0 validation prototype, EB 18.3 Chiron concept, EB 18.4 Veyron concept, W16 engine, top-speed key)

### Tier 3 — `_archive-weak-specimens/` (de-prioritized)

Inside each car folder is an `_archive-weak-specimens/` subfolder holding the modern car-show / museum specimen photos that were cut from active use because Tier 1 or Tier 2 already covers the same historical moment with a stronger artifact. They are not deleted; pull one out if a gallery page needs an additional angle.

- `countach/_archive-weak-specimens/` — 3 modern LP400 Periscopo specimen photos
- `porsche-959/_archive-weak-specimens/` — 2 museum prototype specimen photos
- `mclaren-f1/_archive-weak-specimens/` — 3 modern XP4 / production F1 specimen photos
- `veyron/_archive-weak-specimens/` — 3 modern Goodwood / Gumball / driving specimen photos

## Tier 1 full list — artifacts from the 8 annotated-bibliography sources

### 1970s — Lamborghini Countach LP400
Primary written source: Road & Track, "Lamborghini Countach Road Test," February 1976.
- `1970s-countach/primary-road-and-track-feb-1976/rt-feb-1976-page-01.jpg` — first page of the original road-test
- `1970s-countach/primary-road-and-track-feb-1976/rt-feb-1976-page-02.jpg` — second page (specs, instrumented-test data)

Secondary written source: Chris Perkins, "5 Things You Didn't Know About the Lamborghini Countach," *The Drive*, September 19, 2016.
- `secondary-perkins-the-drive/perkins-countach-hero.jpg`
- `secondary-perkins-the-drive/perkins-countach-inline-1.jpg` through `-4.jpg`
- `secondary-perkins-the-drive/perkins-countach-periscopica-1976.jpg` (period 1976 Periscopica — same spec Road & Track tested)

### 1980s — Porsche 959
Primary written source: Csaba Csere, "1987 Porsche 959 — Archived Test," *Car and Driver*, November 1987.
- `primary-csere-car-and-driver-1987/csere-959-main-photo.jpg` — period photograph from the road test
- `primary-csere-car-and-driver-1987/csere-959-102.jpg` — studio photograph, Car and Driver archive

Secondary written source: David Kimble, "Cutaway Classic: Explore the Amazing Porsche 959," *Motorsport.com*, June 8, 2016.
- `secondary-kimble-motorsport-cutaway/kimble-959-cutaway-s1200.webp` — the David Kimble cutaway illustration, highest resolution available

### 1990s — McLaren F1
Primary written source: Steve Cropley, "McLaren F1: Full Test of World's Greatest Supercar," *Autocar*, May 11, 1994.
- `primary-cropley-autocar-may-1994/autocar-mclaren-f1-02.jpg`
- `primary-cropley-autocar-may-1994/autocar-mclaren-f1-03.jpg`
- `primary-cropley-autocar-may-1994/autocar-mclaren-f1-05.jpg`
- `primary-cropley-autocar-may-1994/autocar-mclaren-f1-08.jpg` (interior / central driving position)
- `primary-cropley-autocar-may-1994/autocar-mclaren-f1-012.jpg`
- `primary-cropley-autocar-may-1994/autocar-mclaren-f1-020.jpg`

Secondary written source: "McLaren F1 Review: Our Original 1994 Road Test," *Car Magazine*, June 1994.
- `secondary-car-magazine-june-1994/car-magazine-june-1994-cover.jpg` — actual June 1994 Car Magazine cover
- `secondary-car-magazine-june-1994/car-magazine-june-1994-spread-01.jpg` through `-03.jpg` — full magazine spread scans

### 2000s — Bugatti Veyron EB 16.4
Primary written source: Steve Cropley, "Bugatti Veyron 2005 First Drive," *Autocar*, 2005.
- `primary-cropley-autocar-2005/autocar-veyron-hero.jpg`
- `primary-cropley-autocar-2005/autocar-veyron-01.jpg` through `-04.jpg` (four editorial photos)
- `primary-cropley-autocar-2005/autocar-veyron-06.jpg`

Secondary written source: "Bugatti Veyron 2005-2015 Review," *Autocar*.
- `secondary-autocar-veyron-2005-2015-review/autocar-veyron-review-05.jpg`
- `secondary-autocar-veyron-2005-2015-review/autocar-veyron-review-223.jpg`

## Chicago citation style — quick reference

Every gallery page renders four things per artifact.

1. **Caption** — one line beneath the image. Pull `chicago_caption` from sources.json. Format: Creator, *Title*, Year, Publication / Repository, URL.
2. **Object label** — 3-5 sentences of analytical prose beneath the caption. **Written by the student** (voice-recorded, transcribed, grammar-cleaned). Claude may add exactly one factual sentence per label pulled from the primary source, no more.
3. **Footnote** — numbered chronologically across the gallery page. Pull `chicago_footnote_short` for subsequent references; first reference uses full bibliographic form.
4. **Bibliography entry** — consolidated on `about.html`. Pull `chicago_bibliography`.

## Writing rules from the project brief

- Main body and paragraph text = student's own voice. Voice-recorded, transcribed, grammar-cleaned.
- Claude may add exactly one factual sentence per label, drawn from the primary source.
- Captions, taglines, navigation labels, headlines = AI-assisted is fine.
- No em dashes anywhere. Replace with commas or reword.

## Fair-use note

Every Tier 1 artifact is used under the educational fair-use doctrine (17 U.S.C. § 107) for a university-course virtual museum exhibit and cites the specific publisher plus source page URL. For works reused outside the UTK course context, the student should seek permission from the rights holder (Hearst for Road & Track and Car and Driver, Haymarket for Autocar, Bauer Media for Car Magazine, Motorsport.com / David Kimble for the 959 cutaway, The Drive / Recurrent Ventures for Perkins' article).
