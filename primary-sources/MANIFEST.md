# Velocity & Vision — Primary Source Manifest

Curated library of first-party image sources for the four gallery pages of the Velocity & Vision Virtual Museum (UTK history class).

Every image falls into one of two classes, tagged in `sources.json`:

- **period-artifact** — an actual contemporaneous artifact from the exhibit period: magazine page scans, factory press photographs, period advertising, celebrity-delivery news stills, auction-catalog provenance photos. These are the artifacts the thesis argues about — the era's own documentation of the car.
- **specimen-photograph** — a modern Wikimedia Commons photograph of the original vehicle at a motor show, museum, or private display. These supplement the period artifacts by showing the physical car as it survives today.

## Folder layout

```
primary-sources/
├── MANIFEST.md                       (this file)
├── CLAUDE_CODE_PROMPT.md             (ready-to-paste prompt for Claude Code)
├── countach/
│   ├── sources.json                  (machine-readable citations + image metadata)
│   ├── magazine/                     (period magazine scans, ads, posters)
│   ├── celebrity-owner/              (designer, builder, famous-owner photography)
│   ├── schematics/                   (design, engineering, cutaway imagery)
│   └── press-launch/                 (factory press photos, motor-show reveals)
├── porsche-959/                      (same 4 subfolders)
├── mclaren-f1/                       (same 4 subfolders)
└── veyron/                           (same 4 subfolders)
```

## Per-car summary

### 1970s — Lamborghini Countach LP400 (12 items: 4 period artifacts + 8 specimen)

Primary written source: Road & Track, "Lamborghini Countach Road Test," February 1976.

**Period artifacts:**
- `magazine/road-track-feb-1976-countach-scan-01.jpg` — actual page scan of the R&T Feb 1976 road test (via Curbside Classic)
- `magazine/road-track-feb-1976-countach-scan-02.jpg` — second page of the R&T Feb 1976 road test (via Curbside Classic)
- `magazine/pirelli-countach-poster-1986.jpg` — Pirelli factory advertising poster, April 1986 (PD)
- `celebrity-owner/walter-wolf-red-countach.jpg` — Walter Wolf with his first LP400 Speciale, c. 1976, the car that pioneered the flared-arch, rear-wing aesthetic
- `celebrity-owner/wolf-of-wall-street-countach-rm-sothebys.webp` — the 1989 Countach 25th Anniversary from *The Wolf of Wall Street*, RM Sotheby's 2023 catalog

**Specimen photographs:**
- `celebrity-owner/gandini-designer-1976.jpg` — Marcello Gandini, the Bertone designer, 1976 (PD)
- `celebrity-owner/bertone-countach-stratos-1970s.jpg` — Nuccio Bertone with the Countach and Stratos, Jesse Alexander (PD)
- `celebrity-owner/bertone-countach-miura-1980s.jpg` — Nuccio Bertone with the Countach and Miura (PD)
- `press-launch/countach-lp400-1974-grand-basel.jpg` — 1974 LP400 specimen (CC BY-SA 4.0)
- `press-launch/countach-lp400-periscopio-1975.jpg` — 1975 LP400 Periscopo specimen (CC BY-SA 4.0)
- `press-launch/countach-lp400-periscopio-1976.jpg` — 1976 Periscopo specimen (CC BY-SA 4.0)
- `schematics/countach-lp500-prototype-2008-recreation.jpg` — LP500 prototype form (CC BY 2.0)

### 1980s — Porsche 959 (12 items: 2 period artifacts + 10 specimen)

Primary written source: Csaba Csere, "1987 Porsche 959 Archived Test," Car and Driver, November 1987.

**Period artifacts:**
- `press-launch/959-gruppe-b-1983-frankfurt-iaa-factory.jpeg` — Porsche's own 1983 Frankfurt IAA press photo of the 'Gruppe B' concept
- `press-launch/959-gruppe-b-1983-factory-3.jpeg` — factory press photo in Rothmans livery showing the Paris-Dakar development thread

**Specimen photographs:**
- `press-launch/959-gruppe-b-concept-1983.jpg` / `959-gruppe-b-concept-rear-1983.jpg` — 1983 Gruppe B concept at museum display (CC BY 2.0)
- `press-launch/959-prototype-hamburg-prototyp.jpg` — Hamburg Prototyp Museum (CC BY-SA 4.0)
- `press-launch/959-prototype-sp24-1985.jpg` — 1985 pre-production (CC BY-SA 4.0)
- `press-launch/961-le-mans-1986.jpg` — 1987 Le Mans 961 race variant in Porsche Museum (CC BY-SA 4.0)
- `schematics/959-mechanical-sketch-stuttgart.jpg` — factory mechanical sketch in Porsche Museum (CC BY 4.0)
- `schematics/959-engine-bay.jpg` — twin-sequential-turbo flat-six detail (CC BY-SA 3.0)
- `celebrity-owner/959-ralph-lauren-collection.jpg` + `959-ralph-lauren-interior.jpg` — Ralph Lauren's 1988 959 Komfort (CC BY-SA 3.0)
- `magazine/959-rothmans-paris-dakar-1986.jpg` — Rothmans-liveried Paris-Dakar winner (CC BY 2.0)

### 1990s — McLaren F1 (18 items: 10 period artifacts + 8 specimen)

Primary written source: Steve Cropley, "McLaren F1: Full Test," Autocar, May 11, 1994.

**Period artifacts (Car Magazine June 1994 + Musk delivery 1999):**
- `magazine/car-magazine-june-1994-cover.jpg` — actual Car Magazine June 1994 cover
- `magazine/car-magazine-june-1994-spread-01.jpg` through `-06.jpg` — six full magazine spread scans of the original 1994 F1 road test (Bauer Media archive)
- `celebrity-owner/elon-musk-mclaren-f1-delivery-1999-01.jpg` — 28-year-old Musk watching his F1 being unloaded, 1999 CNN footage
- `celebrity-owner/elon-musk-mclaren-f1-delivery-1999-02.jpg` — Musk during unloading
- `celebrity-owner/elon-musk-mclaren-f1-delivery-1999-03.jpg` — Musk beside the delivered F1

**Specimen photographs:**
- `press-launch/f1-xp4-prototype-1993.jpg` + `-alt.jpg` — XP4 prototype (CC BY-SA 4.0)
- `press-launch/f1-1994-production.jpg` — 1994 production F1 (CC BY-SA 4.0)
- `schematics/f1-lm-engine-bay.jpg` — BMW V12 with gold-foil heat shield (CC BY-SA 4.0)
- `schematics/f1-1996-front-end-detail.jpg` — chassis 063 detail (CC BY-SA 4.0)
- `celebrity-owner/gordon-murray-1996-le-mans.jpg` — Murray at 1996 Le Mans paddock (CC BY-SA 2.0)
- `magazine/f1-gtr-1995-le-mans-winner.jpg` — 1995 Le Mans-winning GTR at Goodwood (CC BY-SA 4.0)
- `magazine/f1-gtr-nielsen-bscher-donington-1995.jpg` — 1995 BPR Donington race (CC BY-SA 2.0)

### 2000s — Bugatti Veyron EB 16.4 (15 items: 4 period artifacts + 11 specimen)

Primary written source: Steve Cropley, "Bugatti Veyron 2005 First Drive," Autocar, 2005.

**Period artifacts (Bugatti chassis 5.0 validation prototype press photography):**
- `press-launch/veyron-chassis-5-0-validation-prototype-01.jpg` through `-04.jpg` — four Bugatti factory press photos of chassis 5.0, the validation prototype Piech personally signed off on and that ran the 407 km/h Ehra-Lessien certification with Uwe Novacki on 19 April 2005

**Specimen photographs:**
- `press-launch/eb-18-3-chiron-concept-1999.jpg` + `-rear-1999.jpg` — 1999 Frankfurt Chiron 18.3 concept (PD)
- `press-launch/eb-18-4-veyron-concept.jpg` — 1999 Tokyo Veyron 18.4 concept (CC BY 4.0)
- `press-launch/veyron-16-4-early-2004.jpg` — 2004 pre-production Veyron (CC BY-SA 3.0)
- `press-launch/veyron-key-schlussel-2005.jpg` — the top-speed key (PD)
- `schematics/veyron-w16-engine.jpg` — 8.0-litre W16 (CC BY 2.0)
- `schematics/veyron-w16-on-chassis.jpg` — W16 on chassis (CC BY-SA 3.0)
- `schematics/veyron-interior-2007.jpg` — cabin (CC BY-SA 4.0)
- `celebrity-owner/veyron-goodwood-fos-2007.jpg` — 2007 Goodwood FoS (CC BY-SA 2.0)
- `celebrity-owner/veyron-gumball-3000-2007.jpg` — 2007 Gumball 3000 (CC BY-SA 2.0)
- `magazine/veyron-driving-2008.jpg` — Veyron at speed, 2008 (CC BY 2.0)

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

The period-artifact class includes magazine page scans, factory press photos, and news footage stills used under the educational fair-use doctrine (17 U.S.C. § 107) for a university-course virtual museum exhibit. Each such artifact cites the specific publisher or source archive plus the source page URL where it appears. For works reused outside the UTK course context, the student should seek permission from the rights holder (Hearst for Road & Track, Bauer Media for Car Magazine, CNN for the Musk delivery footage, Porsche AG / Bugatti AG for factory press photos, RM Sotheby's for auction catalog photography).
