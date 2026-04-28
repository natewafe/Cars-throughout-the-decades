/**
 * Apply artifact_workbook_clean.xlsx to the codebase:
 *   1. Read the 4 car sheets.
 *   2. Skip ⚠ placeholder rows.
 *   3. Collapse rows sharing MULTI_PAGE_GROUP into kind:"carousel".
 *   4. Solo rows become kind:"figure".
 *   5. Build new bibliography from CITATION fields, dedup, alphabetize.
 *   6. Remove orphans.
 *
 *   Run:  npx tsx scripts/apply_workbook_clean.ts
 */

import ExcelJS from "exceljs";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { artifactsBySlug as currentArtifacts } from "../src/lib/artifacts.js";

const ROOT = process.cwd();
// Source workbook lives at the project root now (user pasted it there).
const SRC = path.resolve(process.cwd(), "artifact_workbook_clean_1.xlsx");

/** Filenames to drop from the workbook entirely (treated as if the row
 *  didn't exist). Use for confirmed duplicates / stragglers. */
const DROP_FILENAMES = new Set<string>([
  // Pirelli poster appears twice — keep the .webp, drop the .jpg dup.
  "03-pirelli-factory-advertising-poster-of-the-countach-in-top-do.jpg",
  // Walter Wolf carousel: page 1 (.webp) duplicates page 2 (.jpg).
  // Drop the .webp; remaining 4 pages renumber automatically.
  "walter-wolf-red-countach.webp",
  // 959 — duplicates of the Kimble cutaway / engine internals already
  // shown as a featured artifact.
  "03-david-kimbles-factory-style-cutaway-illustration-of-the-pors.webp",
  "959-engine-bay.webp",
  // McLaren F1 — drop the entire CNN Elon Musk delivery carousel
  // (3 pages) from the gallery per user request.
  "elon-musk-mclaren-f1-delivery-1999-01.webp",
  "elon-musk-mclaren-f1-delivery-1999-02.webp",
  "elon-musk-mclaren-f1-delivery-1999-03.webp",
  // Countach — Bertone with Stratos and Countand (Jesse Alexander).
  // Already page 2 of the Bertone Designers carousel via the .webp;
  // this .jpg solo is the duplicate.
  "10-bertone-founder-nuccio-bertone-with-the-lancia-stratos-and-l.jpg",
  // Countach "The Drive" carousel: drop the first two pages (hero +
  // inline-1) per user request. Remaining 4 pages renumber.
  "perkins-countach-hero.webp",
  "perkins-countach-inline-1.webp",
]);

/** Final blurbs (student-authored). Applied to artifacts by id at the
 *  end of the build so they survive workbook re-runs. */
const BLURB_OVERRIDES: Record<string, string> = {
 "959-fig-1": "This editorial photograph was published by Driven Car Guide in 2024 in Driven Car Guide's online article \"Mr Bean Buys a Porsche 959, and Other Famous Owners\". It shows Jerry Seinfeld standing next to his Porsche 959. He has a collection of over $100 million worth of cars, and this is one of the most famous in the collection. I found this source at https://www.drivencarguide.co.nz/news/mr-bean-buys-a-porsche-959-and-other-famous-owners/. This artifact is significant to my exhibit because it shows that this is a car that's not just worshiped by people who love the brand Porsche and cars, but also by famous people who use it as a status symbol and something that tells more than the heritage of Porsche.",
 "959-fig-2": "This illustration was drawn by David Kimble in 1985 (originally published in Motor Trend, September 1985; republished 2016) and republished by Motorsport.com in its 2016 Cutaway Classic feature. It shows the technology that's inside this car. There are a few other cutaways that show more in-depth of the inside of what these cars are. I found this source at https://www.motorsport.com/automotive/news/cutaway-classic-explore-the-amazing-porsche-959-745046/745046/. This artifact is significant to my exhibit because it just goes to show the amount of technology that was put into these cars. You can see the axle, the two suspension arms that adjust automatically, and some of the other insane features of this car. It just goes to show the complexity in the engineering behind this feat of technology.",
 "959-ralph-lauren-porsche-959-collection": "This photograph was taken by an uncredited photographer circa 2005-2010 and archived at Wikimedia Commons under CC BY-SA 3.0. It shows the Ralph Lauren collection Porsche 959. This source is held at https://commons.wikimedia.org/wiki/File:Porsche_959_34_left.jpg. This artifact is significant to my exhibit because you can see how many people treasure this car, and it's a car that's meant for the elite nowadays. It's something that even famous designers and others use as a status symbol, even among their own community. It just goes to show how exclusive these types of cars are and how much they really define themselves.",
 "959-porsche-gruppe-b-1983-frankfurt-iaa": "This press photograph was released by Porsche AG in September 1983 as factory press material for the 1983 Frankfurt International Auto Show, with two of the four pages reproduced via StuttCars and two by Wikimedia Commons contributor leduardo (2007). It shows a set of pictures of the prototype Gruppe B Porsche rally car, before it came into production, made for the Group B Porsche rally. This source is held at https://www.stuttcars.com/porsche-959-gruppe-b/. This artifact is significant to my exhibit because a lot of these cars become concept cars and never actually make it to market. You can also see how the design changed from the concept to the production. Some might argue that the concept looked better and more futuristic, but I think there's nothing more unmistakable and nostalgic than how the 959 actually turned out. This just goes to show that part of the process of creating one of these cars is going through these concept phases.",
 "f1-autocar-mclaren-f1-road-test-may-1994": "This magazine photograph was published by Autocar's editorial team (article by Steve Cropley) on May 11, 1994 in Autocar magazine's road test \"McLaren F1: Full Test of World's Greatest Supercar\". It shows one of the first magazine reviews where some of these special creators got a look at this car and were able to test it themselves and give an honest review. This magazine includes many key details of the car, specific specs, and in-depth pictures. I found this source at https://www.autocar.co.uk/car-review/mclaren/f1. This artifact is significant to my exhibit because it shows what the era really thought of what this car was, and what people were reading about this car, because this is what true car enthusiasts would see and read to know what was going on. The review was completely remarkable about the kind of performance the car had, they even described it as the best day of their lives driving this car.",
 "f1-car-magazine-june-1994-mclaren-f1-road-test": "This magazine scan was published by Car Magazine (Bauer Media) in June 1994, with the cover and six interior road-test spreads scanned by Bauer Media for their online archive. It shows another magazine that got to look at the McLaren and got to see what it was like. Here you can see some of the pictures of the McLaren with some famous people driving it, and some of those details of the interior that kind of show the age, even though the exterior really doesn't. I found this source at https://www.carmagazine.co.uk/car-reviews/magazine-reviews/the-first-mclaren-f1-review-car-magazine-june-1994-supercar-test/. This artifact is significant to my exhibit because it really just goes to show the true creativity that went behind this car.",
 "f1-fig-1": "This photograph was taken by Spycatcher58 (Wikimedia Commons contributor) at the Goodwood Festival of Speed (post-1995) and archived at Wikimedia Commons under CC BY-SA 4.0. It shows the Le Mans-winning championship McLaren F1 GTR, alongside some of the other McLaren F1 models, including the LM and the regular McLaren F1. This was at the Goodwood Festival of Speed, and this was the Le Mans-winning car. This source is held at https://commons.wikimedia.org/wiki/File:1995_Le_Mans_winning_McLaren_F1_GTR_display_at_Goodwood_Festival_of_Speed.jpg. This artifact is significant to my exhibit because it's really just a piece of technology for the time period, it was a race car at heart, and that's why it went to win Le Mans and why it was such a crazy car. It's just something that had to be in this exhibit.",
 "f1-fig-3": "This photograph was taken by Martin Lee in 1996 and archived at Wikimedia Commons via Martin Lee's Flickr account, under CC BY-SA 2.0. It shows a picture of Gordon Murray at the Le Mans paddock. This source is held at https://commons.wikimedia.org/wiki/File:Gordon_Murray_chats_in_the_paddock_behind_the_pits_at_the_1996_Le_Mans.jpg. This artifact is significant to my exhibit because I just wanted to throw this in here to kind of see the type of people that put their energy into this car. You might just see them as regular people, and they were, but they had a vision for what truly defined this car.",
 "f1-fig-4": "This video still was broadcast by CNN in 1999 as part of a 1999 news segment, with stills republished by InsideEVs in January 2021. It shows 28-year-old Elon Musk taking delivery of his McLaren F1, after he sold his first company, and CNN did coverage of it. I found this source at https://insideevs.com/features/465537/elon-musk-getting-delivery-mclaren-f1/. This artifact is significant to my exhibit because that's just how crazy of a car this was, Elon Musk back then was a visionary, but he wasn't even what he is today. They still covered this not necessarily for Elon, but for the car, because of how much of an impact this had on the community and the people that were buying these cars. A regular person could not afford this.",
 "f1-1995-le-mans-podium": "This photograph was taken by Martin Lee (with one Goodwood photograph by Spycatcher58) on June 11, 1995 and archived at Wikimedia Commons via Martin Lee's Flickr archive, under CC BY-SA 2.0. It shows pictures of the 1995 Le Mans podium, when the drivers were able to win with the McLaren F1 GTR. This source is held at https://commons.wikimedia.org/wiki/File:The_wining_Mclaren_F1_GTR_-59_team_of_Yannick_Dalmas,_Masanori_Sekiya_%26_J.J.Lehto_on_the_podium_at_Le_Mans_1995_(49627444137).jpg. This artifact is significant to my exhibit because it gives a real perspective into the emotion and drive that racing has, and how this impacted more than just the car community, but even racing itself.",
 "countach-road-track-feb-1976-countach-road-test": "This magazine scan was published by Road & Track magazine's editorial staff in February 1976 in the February 1976 issue of Road & Track, with the four-page road test scanned and republished by the automotive history blog Curbside Classic in 2018. It shows a firsthand representation of what this car was, a true in-depth showing of the numbers that were tested, not what Lamborghini was given to them, but calculated data from this test, really putting the car to see what it was like. I found this source at https://www.curbsideclassic.com/vintage-reviews/road-track-vintage-road-test-1976-lamborghini-countach-fastest-car-weve-ever-tested/. This artifact is significant to my exhibit because it gives a perspective on the time period, the kind of stuff this car was compared to, and the article shows how different it is from what they were used to and how fast it was able to go, all things that were absolutely mind-blowing for the time period of 1976. It's super important in this museum to give that firsthand account of what people would actually be reading about back then and showing some depth into that.",
 "countach-the-drive-5-things-about-the-countach-2016": "This editorial photograph was published by Chris Perkins for The Drive (with photographs largely uncredited inline) on September 19, 2016 in The Drive's vintage column under the title \"5 Things You Didn't Know About the Lamborghini Countach\". It shows photos from different sources, you can see the actual founder of Lamborghini, and one of the pictures of the Lamborghini Countach being assembled. There's also another photo of the Countach at one of the unveilings where it was first shown, you can see that wedge shape before they put the wing on it. I found this source at https://www.thedrive.com/vintage/5226/5-things-you-didnt-know-about-the-lamborghini-countach. This artifact is significant to my exhibit because they did all of this in-house fabrication by hand, which they hadn't done for a long time, and that really made the Countach super special. It's just cool and important to see the concept of the Countach, how it came together, and the man behind it all.",
 "countach-bertone-designers": "This photograph was taken by an unknown period photographer (with one image by Jesse Alexander) between 1974 and 1985 and archived at Wikimedia Commons in the public domain. It shows the designer of the Countach, Marcello Gandini, in 1976. A few times you can see that he was super prevalent, he looks like an Italian man and was prevalent in the design of this car. This source is held at https://commons.wikimedia.org/wiki/File:Marcello_Gandini_in_1976.jpg. This artifact is significant to my exhibit because I think it's important to show the people that worked behind creating these cars, and that it's more than just a car, it's the people who came to make them.",
 // SKIPPED, blurb #14 was written for the Jesse Alexander solo
 // figure of Nuccio Bertone with the Stratos and Countach, but that
 // artifact was dropped earlier (per "Bertone in there twice"). The
 // current countach-fig-3 is a different image (Hamster LP500
 // Prototype). Restoring the Jesse Alexander figure would require
 // removing 10-bertone-founder-...jpg from DROP_FILENAMES.
 // "countach-fig-3": "...",
 "countach-countach-25th-anniversary-edition": "This photograph was taken by MrWalkr and Jones028 (Wikimedia Commons contributors), with one auction catalog photograph by RM Sotheby's, between 2014 and 2023 and archived at Wikimedia Commons under CC BY-SA 4.0 and CC BY 2.0, with one image from RM Sotheby's December 2023 auction catalog for the Wolf of Wall Street car. It shows the 25th Anniversary Edition. This was the edition that was in The Wolf of Wall Street, and you can see that picture here, along with the sold version of it from Sotheby's auction from The Wolf of Wall Street. This source is held at https://commons.wikimedia.org/wiki/File:1988_Lamborghini_Countach_25th_Anniversary_Silver.jpg. This artifact is significant to my exhibit because it shows how the car evolved. It still looks like the same car, but with some more modern features, they just couldn't overcome how great of a design they came up with that first time.",
 "veyron-autocar-bugatti-veyron-first-drive-2005": "This magazine photograph was published by Autocar's editorial team (article by Steve Cropley) in 2005 in Autocar magazine's 2005 first-drive feature \"Bugatti Veyron 2005 First Drive\". It shows a firsthand review of this car. You can see how extremely impressive this was, completely made out of carbon fiber, carrying that carbon fiber monocoque design. A lot of these pictures show the details of the luxury mixed with the functionality that made this car the beast that it was. I found this source at https://www.autocar.co.uk/car-review/bugatti/veyron-2005-2015/first-drives/bugatti-veyron-2005-first-drive. This artifact is significant to my exhibit because this is the car that broke that speed record, the one that was upheld by the McLaren F1. It's a car that defined the era of the 2000s.",
 "veyron-fig-1": "This celebrity news photograph was taken by an uncredited paparazzi photographer in August 2017 and published in the Daily Mail tabloid article \"Jamie Foxx Arrives at Nobu Malibu in Gold Chrome Bugatti Veyron\". It shows Jamie Foxx next to his gold-plated Bugatti. I found this source at https://www.dailymail.co.uk/tvshowbiz/article-4766798/Jamie-Foxx-arrives-Nobu-Malibu-gold-chrome-Bugatti.html. This artifact is significant to my exhibit because it shows the complete absurdity of these cars. They have access to movie stars and actors and people like that, and it's a car that has a presence, that's why these people are buying them. And still today they do.",
 "veyron-fig-3": "This photograph was taken by Dane Poset in 2010 and archived at Wikimedia Commons via Panoramio under CC BY-SA 3.0. It shows the W16 engine, those two V8s right next to each other. You can see how massive this engine bay is, how wide and how heavy that must have been. This source is held at https://commons.wikimedia.org/wiki/File:W-16_on_a_Bugatti_Veyron_-_panoramio.jpg. This artifact is significant to my exhibit because it shows how much they had to overcome to reach that 1,000 horsepower and over 200 miles an hour that this car eventually reached.",
 "veyron-fig-5": "This photograph was taken by Wikimedia Commons contributor Scuderi Ferrari in 2007 (photograph of the 1999 EB 18.3 Chiron concept on display) and archived at Wikimedia Commons in the public domain. It shows the Bugatti Veyron concept car, showing where this car came from, and how different it looks from what it actually became, through those many iterations by the engineers. This source is held at https://commons.wikimedia.org/wiki/File:Bugatti_Chiron_(8162).jpg. This artifact is significant to my exhibit because they had to overcome so much in creating the actual prototype to achieve the goals they wanted to. That's why this EB 18.3 Chiron concept is important to show off, it just looks so much different. You can see the front angle of the car and all that.",
 "veyron-bugatti-ag-chassis-5-0-validation-prototype-2005": "This press photograph was released by Bugatti AG / Volkswagen Group in 2005 as factory press material documenting the chassis 5.0 validation prototype that ran the 407 km/h Ehra-Lessien certification with Uwe Novacki on 19 April 2005, with the photographs reproduced in Supercars.net's October 2025 retrospective. It shows the Bugatti AG chassis validation prototype, 2005. This car is beautiful and it was shown off to the elite. You can just see how much of a presence this car had and how luxurious they look. The locations these were at and the pictures that were taken are so professional and absurd. I found this source at https://www.supercars.net/blog/bugatti-veyron-chassis-5-0-the-dream-that-defined-the-hypercar-era/. This artifact is significant to my exhibit because it's such a cool car, and it's something you see today and still look at and think \"wow.\" But you can start to see the age of it, and I think it's apparent in some of these pictures.",
};

/** Group titles that should NOT be carousels — the rows are mixed-
 *  source and were incorrectly bundled in the workbook. Each row
 *  becomes its own solo figure instead. (Carousel = same source only.) */
/** Carousels (or solo figures) that should be FEATURED regardless of
 *  the workbook's FEATURED column. Match by carousel title or by
 *  filename for solo figures. The user picks pages by their caption,
 *  but a "feature" decision applies to the whole containing artifact. */
const FORCE_FEATURED_TITLES = new Set<string>([
  "Bugatti AG Chassis 5.0 Validation Prototype, 2005",
  "Autocar Bugatti Veyron First Drive, 2005",
]);
const FORCE_FEATURED_FILENAMES = new Set<string>([
  // (none yet — add solo-figure filenames here when needed)
]);

const UNGROUP_TITLES = new Set<string>([
  // Different photographers (Snelson + Poset).
  "Veyron W16 Engine",
  // Different photographers + different concept cars all mixed.
  "Bugatti Veyron Pre-Production Concepts",
]);

/** Extra carousel pages to append after building from the workbook.
 *  Used when the user adds pages to a magazine spread without editing
 *  the spreadsheet. Each entry: car slug + carousel title (substring
 *  match) + the additional pages in order. */
const EXTRA_CAROUSEL_PAGES: {
  slug: string;
  carouselTitleContains: string;
  pages: { filename: string; pageLabel?: string }[];
}[] = [
  {
    slug: "countach",
    carouselTitleContains: "Road & Track Feb 1976",
    pages: [
      { filename: "rt-feb-1976-page-03.webp" },
      { filename: "rt-feb-1976-page-04.webp" },
    ],
  },
];

/** Resolve ⚠ placeholder rows by mapping sheet + URL fragment to the
 *  real filename and license to use. Each entry is checked against the
 *  ⚠ row's URL/citation; if it matches the row's FILENAME and LICENSE
 *  are rewritten in memory before processing. */
const PLACEHOLDER_RESOLUTIONS: {
  sheet: string;
  urlContains: string;
  filename: string;
  license: string;
}[] = [
  {
    sheet: "Porsche 959",
    urlContains: "drivencarguide.co.nz",
    filename: "seinfeld-porsche-959.jpg",
    license: "Fair use, editorial",
  },
  {
    sheet: "Bugatti Veyron",
    urlContains: "dailymail.co.uk",
    filename: "jamie-foxx-bugatti-veyron-2017.webp",
    license: "Fair use, editorial",
  },
];
const ARTIFACTS_PATH = path.resolve(ROOT, "src/lib/artifacts.ts");
const BIB_PATH = path.resolve(ROOT, "src/lib/bibliography.ts");
const TS = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

const SHEET_TO_SLUG: Record<string, string> = {
  "McLaren F1": "f1",
  "Porsche 959": "959",
  "Lamborghini Countach": "countach",
  "Bugatti Veyron": "veyron",
};
const SLUG_DISPLAY: Record<string, string> = {
  f1: "McLaren F1",
  "959": "Porsche 959",
  countach: "Lamborghini Countach",
  veyron: "Bugatti Veyron",
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function isYes(v: unknown): boolean {
  return typeof v === "string" && /^(yes|y|true|1|✓|✔)$/i.test(v.trim());
}

function cellStr(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "object" && "text" in (v as Record<string, unknown>)) {
    return String((v as { text: unknown }).text ?? "");
  }
  if (typeof v === "object" && "result" in (v as Record<string, unknown>)) {
    return String((v as { result: unknown }).result ?? "");
  }
  if (typeof v === "object" && "richText" in (v as Record<string, unknown>)) {
    const rt = (v as { richText: { text: string }[] }).richText;
    return rt.map((p) => p.text).join("");
  }
  if (typeof v === "object" && "hyperlink" in (v as Record<string, unknown>)) {
    return String((v as { hyperlink: unknown }).hyperlink ?? "");
  }
  return String(v);
}

// ============================================================
// Types for new artifacts shape
// ============================================================

type FigureItem = {
  kind: "figure";
  id: string;
  filename: string;
  section: string;
  citation: string;
  url: string;
  license: string;
  featured: boolean;
  blurb: string;
};
type CarouselPage = { filename: string; caption: string };
type CarouselItem = {
  kind: "carousel";
  id: string;
  title: string;
  section: string;
  citation: string;
  featured: boolean;
  blurb: string;
  pages: CarouselPage[];
};
type Item = FigureItem | CarouselItem;

type ParsedRow = {
  fig: string;
  filename: string;
  section: string;
  citation: string;
  url: string;
  license: string;
  group: string;
  featured: boolean;
  blurb: string;
};

// ============================================================
// Read workbook
// ============================================================

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(SRC);

  const skipped: { sheet: string; filename: string; row: number }[] = [];
  const perCar = new Map<string, ParsedRow[]>();

  for (const ws of wb.worksheets) {
    const slug = SHEET_TO_SLUG[ws.name];
    if (!slug) continue;
    const rows: ParsedRow[] = [];
    ws.eachRow({ includeEmpty: false }, (row, n) => {
      if (n === 1) return;
      let filename = cellStr(row.getCell(2).value).trim();
      const url = cellStr(row.getCell(5).value).trim();
      let license = cellStr(row.getCell(6).value).trim();
      if (!filename) return;
      if (DROP_FILENAMES.has(filename)) return;
      if (filename.startsWith("⚠")) {
        const resolution = PLACEHOLDER_RESOLUTIONS.find(
          (r) => r.sheet === ws.name && url.includes(r.urlContains)
        );
        if (resolution) {
          filename = resolution.filename;
          if (license.startsWith("⚠") || !license) license = resolution.license;
        } else {
          skipped.push({ sheet: ws.name, filename, row: n });
          return;
        }
      }
      // Strip blurbs that are literally "yes" — those were left over
      // from selecting/highlighting cells, not actual blurb copy.
      // Also strip ⚠ disclaimer/instruction blurbs (e.g. "⚠ Download
      // image from URL... Rename file to..."). Those were notes for
      // the user during prep, not display copy.
      const rawBlurb = cellStr(row.getCell(9).value).trim();
      const blurb = /^(yes|y|true|✓|✔)$/i.test(rawBlurb) || rawBlurb.startsWith("⚠")
        ? ""
        : rawBlurb;
      rows.push({
        fig: cellStr(row.getCell(1).value).trim(),
        filename,
        section: cellStr(row.getCell(3).value).trim(),
        citation: cellStr(row.getCell(4).value).trim(),
        url,
        license,
        group: cellStr(row.getCell(7).value).trim(),
        featured: isYes(cellStr(row.getCell(8).value)),
        blurb,
      });
    });
    perCar.set(slug, rows);
  }

  // ============================================================
  // Build artifact items per car (collapse carousels)
  // ============================================================

  const newArtifacts: Record<string, { primarySource: { bibliography: string; citation: string }; imgDir: string; artifacts: Item[] }> = {};
  const carouselReport: { slug: string; title: string; pages: number }[] = [];

  for (const [slug, rows] of perCar) {
    const cur = currentArtifacts[slug];
    const imgDir = cur?.imgDir ?? slug;
    const primarySource = cur?.primarySource ?? { bibliography: "", citation: "" };

    const items: Item[] = [];
    const seenGroups = new Set<string>();
    let figCounter = 0;

    for (const row of rows) {
      if (row.group && !UNGROUP_TITLES.has(row.group)) {
        if (seenGroups.has(row.group)) continue;
        seenGroups.add(row.group);
        // Collect every row in this car that shares the group, in
        // their original order.
        const groupRows = rows.filter((r) => r.group === row.group);
        const total = groupRows.length;
        // Featured: true if ANY row in group says so, OR if the title
        // is in the FORCE_FEATURED_TITLES override.
        const featured =
          groupRows.some((r) => r.featured) || FORCE_FEATURED_TITLES.has(row.group);
        // Blurb: first non-empty MY BLURB in the group.
        const blurb = groupRows.find((r) => r.blurb)?.blurb ?? "";
        const pages: CarouselPage[] = groupRows.map((r, i) => ({
          filename: r.filename,
          caption: `Page ${i + 1} of ${total} — ${r.citation}`,
        }));
        items.push({
          kind: "carousel",
          id: `${slug}-${slugify(row.group)}`,
          title: row.group,
          section: groupRows[0].section,
          citation: groupRows[0].citation,
          featured,
          blurb,
          pages,
        });
        carouselReport.push({ slug, title: row.group, pages: pages.length });
      } else {
        figCounter++;
        items.push({
          kind: "figure",
          id: `${slug}-fig-${figCounter}`,
          filename: row.filename,
          section: row.section,
          citation: row.citation,
          url: row.url,
          license: row.license,
          featured: row.featured || FORCE_FEATURED_FILENAMES.has(row.filename),
          blurb: row.blurb,
        });
      }
    }

    newArtifacts[slug] = { primarySource, imgDir, artifacts: items };
  }

  // Apply BLURB_OVERRIDES — final student-authored blurbs by id.
  const blurbApplied = new Set<string>();
  for (const slug of Object.keys(newArtifacts)) {
    for (const it of newArtifacts[slug].artifacts) {
      const override = BLURB_OVERRIDES[it.id];
      if (override !== undefined) {
        it.blurb = override;
        blurbApplied.add(it.id);
      }
    }
  }
  const blurbMissing = Object.keys(BLURB_OVERRIDES).filter((id) => !blurbApplied.has(id));

  // Apply EXTRA_CAROUSEL_PAGES: inject extra pages into matching carousels.
  for (const extra of EXTRA_CAROUSEL_PAGES) {
    const car = newArtifacts[extra.slug];
    if (!car) continue;
    const target = car.artifacts.find(
      (it) => it.kind === "carousel" && it.title.includes(extra.carouselTitleContains)
    );
    if (!target || target.kind !== "carousel") continue;
    const startIdx = target.pages.length;
    for (let i = 0; i < extra.pages.length; i++) {
      const p = extra.pages[i];
      const pageNum = startIdx + i + 1;
      target.pages.push({
        filename: p.filename,
        caption: `Page ${pageNum} — ${target.citation}`,
      });
    }
    // Update earlier captions to reflect new total.
    const total = target.pages.length;
    target.pages = target.pages.map((pg, idx) => ({
      filename: pg.filename,
      caption: `Page ${idx + 1} of ${total} — ${target.citation}`,
    }));
  }

  // ============================================================
  // Step 6 — orphan removal: any filename in current data that's NOT
  // referenced anywhere in the new artifacts is logged. (The new
  // artifacts.ts already only contains rows from the workbook, so
  // orphans are implicitly removed by replacement; we just need to
  // report what got dropped.)
  // ============================================================

  const newFilenames = new Set<string>();
  for (const slug of Object.keys(newArtifacts)) {
    for (const it of newArtifacts[slug].artifacts) {
      if (it.kind === "figure") newFilenames.add(`${slug}/${it.filename}`);
      else for (const p of it.pages) newFilenames.add(`${slug}/${p.filename}`);
    }
  }
  const orphanedFigures: { slug: string; filename: string }[] = [];
  for (const slug of Object.keys(currentArtifacts)) {
    for (const it of currentArtifacts[slug].artifacts) {
      if (it.kind === "figure" && !newFilenames.has(`${slug}/${it.filename}`)) {
        orphanedFigures.push({ slug, filename: it.filename });
      }
    }
  }

  // ============================================================
  // Step 5 — bibliography from CITATION fields
  // ============================================================

  // Collect every unique citation appearing in the new artifacts.
  const citationSet = new Set<string>();
  for (const slug of Object.keys(newArtifacts)) {
    for (const it of newArtifacts[slug].artifacts) {
      if (it.citation) citationSet.add(it.citation);
    }
  }

  // Dedup by (authorSurname, year, publication-stem).
  const bibFingerprint = (entry: string): string => {
    const stripped = entry.replace(/['"'']/g, "");
    const author = (() => {
      const sepIdx = (() => {
        const a = stripped.indexOf(",");
        const b = stripped.indexOf(".");
        if (a < 0) return b;
        if (b < 0) return a;
        return Math.min(a, b);
      })();
      if (sepIdx <= 0) return stripped.slice(0, 30);
      const chunk = stripped.slice(0, sepIdx);
      const charAfter = stripped[sepIdx];
      if (charAfter === ",") return chunk.toLowerCase().split(/\s+/)[0];
      const words = chunk.split(/\s+/);
      return words[words.length - 1].toLowerCase().replace(/[^a-z0-9]/g, "");
    })();
    const year = (entry.match(/\b(19|20)\d{2}\b/) || [""])[0];
    // publication-stem: first quoted/italicized title fragment, lowercased
    const titleMatch = entry.match(/[''""\*]([^''""*]+)[''""\*]/);
    const title = (titleMatch ? titleMatch[1] : "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .split(" ")
      .slice(0, 6)
      .join(" ");
    return `${author}|${year}|${title}`;
  };

  const groups = new Map<string, string[]>();
  for (const c of citationSet) {
    const k = bibFingerprint(c);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(c);
  }
  const newBibliography: string[] = [];
  for (const [_k, entries] of groups) {
    if (entries.length === 1) newBibliography.push(entries[0]);
    else {
      // Prefer the longest version (most complete, likely with URL).
      entries.sort((a, b) => b.length - a.length);
      newBibliography.push(entries[0]);
    }
  }
  // Alphabetize by surname.
  newBibliography.sort((a, b) => {
    const ka = (a.split(/[,.]/)[0] || a).toLowerCase();
    const kb = (b.split(/[,.]/)[0] || b).toLowerCase();
    return ka.localeCompare(kb);
  });

  // ============================================================
  // Emit src/lib/artifacts.ts
  // ============================================================

  const J = (s: string) => JSON.stringify(s);
  const emitFigure = (f: FigureItem, indent: string) => [
    `${indent}{`,
    `${indent}  kind: "figure",`,
    `${indent}  id: ${J(f.id)},`,
    `${indent}  filename: ${J(f.filename)},`,
    `${indent}  section: ${J(f.section)},`,
    `${indent}  citation: ${J(f.citation)},`,
    `${indent}  url: ${J(f.url)},`,
    `${indent}  license: ${J(f.license)},`,
    `${indent}  featured: ${f.featured},`,
    `${indent}  blurb: ${J(f.blurb)},`,
    `${indent}},`,
  ].join("\n");
  const emitCarousel = (c: CarouselItem, indent: string) => {
    const pages = c.pages
      .map((p) => `${indent}    { filename: ${J(p.filename)}, caption: ${J(p.caption)} },`)
      .join("\n");
    return [
      `${indent}{`,
      `${indent}  kind: "carousel",`,
      `${indent}  id: ${J(c.id)},`,
      `${indent}  title: ${J(c.title)},`,
      `${indent}  section: ${J(c.section)},`,
      `${indent}  citation: ${J(c.citation)},`,
      `${indent}  featured: ${c.featured},`,
      `${indent}  blurb: ${J(c.blurb)},`,
      `${indent}  pages: [`,
      pages,
      `${indent}  ],`,
      `${indent}},`,
    ].join("\n");
  };

  const artifactsTs = `// Generated by scripts/apply_workbook_clean.ts from
// artifact_workbook_clean.xlsx. Re-running the Python build pipeline
// (_build_nextjs_data.py) will overwrite this with the old shape.

export type ArtifactFigure = {
  kind: "figure";
  id: string;
  filename: string;
  section: string;
  citation: string;
  url: string;
  license: string;
  featured: boolean;
  blurb: string;
};
export type CarouselPage = { filename: string; caption: string };
export type ArtifactCarousel = {
  kind: "carousel";
  id: string;
  title: string;
  section: string;
  citation: string;
  featured: boolean;
  blurb: string;
  pages: CarouselPage[];
};
export type ArtifactItem = ArtifactFigure | ArtifactCarousel;
export type CarArtifacts = {
  primarySource: { bibliography: string; citation: string };
  imgDir: string;
  artifacts: ArtifactItem[];
};

export const artifactsBySlug: Record<string, CarArtifacts> = {
${Object.keys(newArtifacts).map((slug) => {
  const car = newArtifacts[slug];
  const items = car.artifacts
    .map((it) => (it.kind === "figure" ? emitFigure(it, "      ") : emitCarousel(it, "      ")))
    .join("\n");
  return [
    `  ${J(slug)}: {`,
    `    primarySource: {`,
    `      bibliography: ${J(car.primarySource.bibliography)},`,
    `      citation: ${J(car.primarySource.citation)},`,
    `    },`,
    `    imgDir: ${J(car.imgDir)},`,
    `    artifacts: [`,
    items,
    `    ],`,
    `  },`,
  ].join("\n");
}).join("\n")}
};
`;

  // ============================================================
  // Emit src/lib/bibliography.ts
  // ============================================================

  const bibTs = `// Generated by scripts/apply_workbook_clean.ts from artifacts.
// One entry per unique source, alphabetized by author surname.

export const bibliography: string[] = [
${newBibliography.map((e) => `  ${J(e)},`).join("\n")}
];
`;

  // ============================================================
  // Backup + write
  // ============================================================

  fs.writeFileSync(`${ARTIFACTS_PATH}.backup.${TS}`, fs.readFileSync(ARTIFACTS_PATH));
  fs.writeFileSync(ARTIFACTS_PATH, artifactsTs);
  // bibliography.ts is now hand-authored via bibliography.docx +
  // scripts/import_docx_bibliography.ts. Do NOT overwrite it here.
  // (Was: fs.writeFileSync(BIB_PATH, bibTs); — disabled.)
  void bibTs;

  // ============================================================
  // Report
  // ============================================================

  console.log(`\n=== APPLY WORKBOOK CLEAN ===\n`);

  let totalArtifacts = 0;
  let totalCarousels = 0;
  let totalFigures = 0;
  for (const slug of Object.keys(newArtifacts)) {
    const items = newArtifacts[slug].artifacts;
    const figs = items.filter((i) => i.kind === "figure");
    const cars = items.filter((i) => i.kind === "carousel");
    const featured = items.filter((i) => i.featured);
    const gallery = items.filter((i) => !i.featured);
    totalArtifacts += items.length;
    totalCarousels += cars.length;
    totalFigures += figs.length;
    console.log(`${SLUG_DISPLAY[slug]}: ${items.length} artifacts`);
    console.log(`  ${figs.length} solo figures, ${cars.length} carousels`);
    console.log(`  Featured: ${featured.length}  |  Gallery: ${gallery.length}`);
  }
  console.log();

  if (carouselReport.length) {
    console.log(`Carousel groups created (${carouselReport.length}):`);
    for (const c of carouselReport) {
      console.log(`  [${c.slug}] "${c.title}" — ${c.pages} pages`);
    }
    console.log();
  }

  console.log(`Total artifacts: ${totalArtifacts}`);
  console.log(`  Solo figures:   ${totalFigures}`);
  console.log(`  Carousels:      ${totalCarousels}`);
  console.log();

  console.log(`Bibliography: ${newBibliography.length} entries (alphabetized, deduplicated by author+year+title).`);
  console.log();

  if (skipped.length) {
    console.log(`⚠ Skipped ${skipped.length} placeholder rows (FILENAME starts with ⚠):`);
    for (const s of skipped) {
      console.log(`  [${s.sheet} row ${s.row}] ${s.filename}`);
    }
    console.log();
  }

  if (orphanedFigures.length) {
    console.log(`Removed from artifacts.ts (no longer in workbook): ${orphanedFigures.length}`);
    for (const o of orphanedFigures) {
      console.log(`  [${o.slug}] ${o.filename}`);
    }
    console.log();
  }

  console.log(`Blurbs applied: ${blurbApplied.size}/${Object.keys(BLURB_OVERRIDES).length}`);
  if (blurbMissing.length) {
    console.log(`⚠ Blurb override IDs not matched (no such artifact in current build):`);
    for (const id of blurbMissing) console.log(`    ${id}`);
  }
  console.log();
  console.log(`Files changed:`);
  console.log(`  src/lib/artifacts.ts (backup: artifacts.ts.backup.${TS})`);
  console.log(`  src/lib/bibliography.ts (backup: bibliography.ts.backup.${TS})`);

  // Try to regen citations
  const r = spawnSync("npx", ["tsx", "scripts/build_citations.ts"], { cwd: ROOT, stdio: "inherit", shell: true });
  if (r.status !== 0) {
    console.warn(`\n⚠ build_citations.ts failed (probably an old-shape dependency or CITATIONS.md is open). Run after closing it.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
