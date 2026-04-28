/**
 * Wire heroHeadline and source fields into cars.ts (and remove the
 * trailing footnote from each car's essay[] array). Re-emits cars.ts
 * preserving every other field.
 *
 *   Run:  npx tsx scripts/apply_hero_and_source.ts
 */

import fs from "node:fs";
import path from "node:path";
import { cars } from "../src/lib/cars.js";

const CARS_PATH = path.resolve(process.cwd(), "src/lib/cars.ts");
const TS = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

const HERO: Record<string, string> = {
  f1: "The first production car with a carbon fiber monocoque chassis. The fastest production car on earth for over a decade.",
  "959": "The first production car with computer-controlled all-wheel drive. The first to use sequential turbocharging. The grandfather of every modern performance car.",
  countach: "The first production car with scissor doors. The shape that defined what a supercar was supposed to look like for the next thirty years.",
  veyron: "The first production car to break 400 km/h. The only car Autocar has ever measured to 220 mph.",
};

const SOURCE: Record<string, string> = {
  f1: '(1) Bell, Roger. "McLaren F1 Review: Our Original 1994 Road Test." Car Magazine, June 1994.',
  "959": '(2) Pankew, Dave. "Cutaway Classic: Explore the Amazing Porsche 959." Motorsport.com, June 8, 2016.',
  countach: '(3) Prince, Max. "5 Things You Didn\'t Know About the Lamborghini Countach." The Drive, September 19, 2016.',
  veyron: '(4) Prior, Matt. "Used Bugatti Veyron 2005-2015 Review." Autocar, August 6, 2014.',
};

function tsString(s: string): string {
  return JSON.stringify(s);
}

function emit(): string {
  const header = `export type Car = {
  slug: string;
  name: string;
  maker: string;
  year: number;
  decade: string;
  /** Short prose statement of significance, rendered between the
   *  maker/name line and the tagline on each car page. Optional. */
  heroHeadline?: string;
  tagline: string;
  essay: string[];
  /** Source / footnote line rendered beneath the essay block in a
   *  small italic muted style. Optional. */
  source?: string;
  stats: { label: string; value: string }[];
  hero: { caption: string };
  images: string[];
  modelUrl?: string;
};

export const cars: Car[] = [
`;

  const blocks = cars.map((car) => {
    // Drop the trailing footnote element if it matches the SOURCE
    // string (it was appended in the previous round) — otherwise keep
    // essay as-is.
    const wantedSource = SOURCE[car.slug];
    let essay = car.essay.slice();
    if (wantedSource && essay.length > 0 && essay[essay.length - 1] === wantedSource) {
      essay = essay.slice(0, -1);
    }
    // Defensive: also drop any final element that simply starts with
    // the matching "(N) " marker, in case whitespace differs.
    if (wantedSource && essay.length > 0 && /^\(\d+\)\s/.test(essay[essay.length - 1])) {
      essay = essay.slice(0, -1);
    }

    const heroHeadline = HERO[car.slug];
    const source = SOURCE[car.slug];

    const essayBlock = essay.map((p) => `      ${tsString(p)},`).join("\n");
    const statsBlock = car.stats
      .map((s) => `      { label: ${tsString(s.label)}, value: ${tsString(s.value)} },`)
      .join("\n");
    const imagesBlock = car.images.map((img) => `      ${tsString(img)},`).join("\n");

    const lines = [
      `  {`,
      `    slug: ${tsString(car.slug)},`,
      `    name: ${tsString(car.name)},`,
      `    maker: ${tsString(car.maker)},`,
      `    year: ${car.year},`,
      `    decade: ${tsString(car.decade)},`,
      heroHeadline ? `    heroHeadline: ${tsString(heroHeadline)},` : null,
      `    tagline: ${tsString(car.tagline)},`,
      `    essay: [`,
      essayBlock,
      `    ],`,
      source ? `    source: ${tsString(source)},` : null,
      `    stats: [`,
      statsBlock,
      `    ],`,
      `    hero: { caption: ${tsString(car.hero.caption)} },`,
      car.modelUrl ? `    modelUrl: ${tsString(car.modelUrl)},` : null,
      `    images: [`,
      imagesBlock,
      `    ],`,
      `  },`,
    ].filter((x) => x !== null) as string[];

    return lines.join("\n");
  }).join("\n");

  const footer = `
];

export const carsBySlug = Object.fromEntries(cars.map((c) => [c.slug, c]));
`;

  return `${header}${blocks}${footer}`;
}

const original = fs.readFileSync(CARS_PATH, "utf8");
fs.writeFileSync(`${CARS_PATH}.backup.${TS}`, original, "utf8");
fs.writeFileSync(CARS_PATH, emit(), "utf8");

console.log(`✓ Updated cars.ts`);
for (const car of cars) {
  const wantedSource = SOURCE[car.slug];
  const droppedFootnote =
    wantedSource && car.essay.length > 0 && car.essay[car.essay.length - 1] === wantedSource;
  const droppedByPattern =
    !droppedFootnote &&
    car.essay.length > 0 &&
    /^\(\d+\)\s/.test(car.essay[car.essay.length - 1]);
  console.log(
    `  - ${car.slug}: heroHeadline ${HERO[car.slug] ? "✓" : "—"}  source ${SOURCE[car.slug] ? "✓" : "—"}  footnote dropped from essay: ${droppedFootnote || droppedByPattern ? "yes" : "no"}`
  );
}
console.log(`Backup: src/lib/cars.ts.backup.${TS}`);
