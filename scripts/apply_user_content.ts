/**
 * Replace per-car taglines, essays, and scroll captions with the user's
 * authored copy. No code/structural changes — only string values in
 * src/lib/cars.ts and src/lib/scenes.ts.
 *
 *   Run:  npx tsx scripts/apply_user_content.ts
 *
 * For each car, the script:
 *   - Re-emits cars.ts with the new tagline + essay array (essay
 *     gains a final element containing the footnote line, so the
 *     "(N)" inline marker in the prose has a target on-page).
 *   - Re-emits scenes.ts with the new caption text (eyebrow + line),
 *     preserving from/to/pos and every other scene field.
 *
 * Backups are written to <file>.backup.<timestamp> beside each.
 */

import fs from "node:fs";
import path from "node:path";
import { cars } from "../src/lib/cars.js";
import { scenesBySlug } from "../src/lib/scenes.js";

const ROOT = process.cwd();
const CARS_PATH = path.resolve(ROOT, "src/lib/cars.ts");
const SCENES_PATH = path.resolve(ROOT, "src/lib/scenes.ts");
const TS = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

// ============================================================
// User-supplied content
// ============================================================

type CarContent = {
  tagline: string;
  essay: string[];      // includes the footnote as final element
  captions: { eyebrow: string; line: string }[];
};

const CONTENT: Record<string, CarContent> = {
  f1: {
    tagline:
      "The only road car ever designed with zero compromises, no committee, no cost limits, no traction control.",
    essay: [
      "The McLaren F1 was the only road car designed with no compromises. Nobody to answer to, no cost limits, just Gordon Murray's vision of building the purest road car ever made. Murray conceived the idea on a flight home from the 1988 Italian Grand Prix, and the brief was simple: go all out. They spent over five years working on the car, and only 106 were ever made.",
      "What is remarkable is that in the 1990s, this was the car that set the standard for today. The carbon fiber monocoque tub was unheard of in a production car, as most cars of the era were built from fiberglass or aluminum. That construction is now standard on cars from Pagani, McLaren, and even the Alfa Romeo 4C, but the F1 was the first production car to do it. The central driving position, with the driver seated in the middle and two passengers behind, was equally radical. Gordon Murray revisited the concept decades later with the Gordon Murray T.50, and it still stands as one of the most distinctive cockpit designs in automotive history. The engine bay was lined with gold foil, the same material used on spacecraft, to reflect heat away from the V12. Roger Bell, writing for Car Magazine in 1994, drove the car with no minder and no demonstration lap and described how it humbled icons like the Ferrari F40, the Porsche 959, and the Jaguar XJ220, reaching 100 mph in under eight seconds. (1) The top speed record of 391 km/h set in 1998 stood for over a decade before the Bugatti Veyron took it.",
      '(1) Bell, Roger. "McLaren F1 Review: Our Original 1994 Road Test." Car Magazine, June 1994.',
    ],
    captions: [
      { eyebrow: "Central driving position", line: "The driver sits in the center. Not left, not right. The center." },
      { eyebrow: "Carbon monocoque",         line: "Carbon fiber body, gold-lined engine bay. Every gram was argued over." },
      { eyebrow: "627 horsepower",           line: "No traction control. Murray said you didn't need it." },
      { eyebrow: "391 km/h",                 line: "1998. No production car touched it for twelve years." },
    ],
  },
  "959": {
    tagline:
      "Porsche built the future of the supercar, all-wheel drive, sequential turbos, adaptive suspension, in 1986, and lost money on every single one.",
    essay: [
      'The Porsche 959 was a vision of the future disguised as an 1980s car. It was first conceived in 1981 and shown publicly as the "Gruppe B" concept in 1983, built to compete in Group B rallying. Porsche needed to sell road-legal versions to homologate it for racing, so only 292 production cars were built from 1986 to 1988. This was not a car built to be profitable. It was a statement. Dave Pankew, writing for Motorsport.com in 2016, describes it as essentially a 911 shell with a ridiculous amount of tech stuffed inside. (2)',
      "What made the 959 so far ahead of its time was how many things it invented at once. The PSK all-wheel drive system had four driver-selectable modes, dry, wet, snow, and ice, and automatically shifted torque between the front and rear wheels depending on grip. The sequential turbocharging system was a world first: a smaller turbo spooled up quickly at low revs for instant power, while the larger turbo came in at higher RPM for full output, producing around 450 horsepower total. There were two dampers per corner, one controlling stiffness and one controlling ride height, which automatically lowered the car at speed. All of this produced a 0 to 60 time of around 3.2 seconds and a top speed of 197 mph in a manual car, in the 1980s. (2) Cars like the Ferrari F40 and the Jaguar XJ220 get more attention from that era, but the Porsche 959 had more technology than both of them combined, and most other manufacturers didn't catch up for decades.",
      '(2) Pankew, Dave. "Cutaway Classic: Explore the Amazing Porsche 959." Motorsport.com, June 8, 2016.',
    ],
    captions: [
      { eyebrow: "PSK all-wheel drive",        line: "All-wheel drive with four modes. In 1986. Before anyone else asked for it." },
      { eyebrow: "Sequential turbocharging",   line: "Two turbos, working in sequence. No lag. No compromise." },
      { eyebrow: "Two dampers per corner",     line: "One for stiffness. One for height. Both automatic." },
      { eyebrow: "292 built",                  line: "Every one lost Porsche money. Every one rewrote the rulebook." },
    ],
  },
  countach: {
    tagline:
      "Marcello Gandini drew a wedge in 1971, and the supercar has been trying to catch up ever since.",
    essay: [
      "The Lamborghini Countach was a statement of design. Before it, supercars were teardrop-shaped, think old Ferraris and Bugattis, smaller and rounded. The Countach was wide, low, and shaped like a wedge, and it created a new design language that cars are still following today. Bertone designer Marcello Gandini unveiled the LP500 prototype at the 1971 Geneva Motor Show and orders flooded in. Production of the LP400 began in 1974. The car only went into production because founder Ferruccio Lamborghini bet that test driver Bob Wallace could drive the prototype to Sicily and back. If it made it, they would build it. The prototype made it in May 1972. This was the car that truly saved Lamborghini from financial ruin, a company that had started building tractors and was now setting the standard for what an exotic car could be.",
      "As iconic as it looks, the rear wing on the Countach is completely nonfunctional. The engineers zeroed out its angle because it actually made the aerodynamics worse, but customers loved the look. Because Lamborghini could not afford to re-certify the car with a new aero part, completed cars were pulled off the assembly line and into the factory parking lot, where workers bolted the wing on with an electric hand drill, about ten minutes per car. The car also never went through a proper wind tunnel. Engineers taped fabric strips to the body, drove it on the freeway, photographed it, and adjusted the shape based on the pictures. When they ran official top speed tests, they removed the mirrors, altered the suspension, and added intake spacers, anything to beat Ferrari. (3) The rivalry between Lamborghini and Ferrari at the time was fierce, and this car was their weapon.",
      "Production ran for sixteen years, from 1974 to 1990, across five major variants, the LP400, LP400S, LP500S, Quattrovalvole, and the 25th Anniversary edition, which is the white car famously driven in The Wolf of Wall Street. Each revision added more horsepower, wider tires, and more aerodynamic body parts, but each one also moved further from Gandini's original clean and simple design. More recently, Lamborghini released a modern Countach to celebrate the original, a limited-run revival that sold for millions per car, proving that fifty years later the design still speaks for itself. The scissor door became the defining visual symbol of the exotic car. Every supercar has referenced it. The car that was only built because of a bet, whose famous wing was bolted on in a parking lot, ended up being the shape that defined an entire era.",
      '(3) Prince, Max. "5 Things You Didn\'t Know About the Lamborghini Countach." The Drive, September 19, 2016.',
    ],
    captions: [
      { eyebrow: "Gallery I, 1970s",   line: "Designed in 1971. Still the shape people draw when they imagine a supercar." },
      { eyebrow: "The rear wing",      line: "That rear wing? Bolted on in a parking lot. With a hand drill." },
      { eyebrow: "No wind tunnel",     line: "Never saw the inside of a wind tunnel. Engineers used fabric strips and a camera." },
      { eyebrow: "16 years in production", line: "Every revision added wings. Every one moved further from the original." },
    ],
  },
  veyron: {
    tagline:
      "Ferdinand Piech set a target his own engineers said was impossible, 1,000 horsepower, 400 km/h, everyday usability, and then made them build it anyway.",
    essay: [
      "Volkswagen Group boss Ferdinand Piech revived the Bugatti brand in the late 1990s with one goal: to build a car that outdid everyone. With cars like the McLaren F1, the Porsche 959, and the Ferrari F40 already setting the benchmark, Bugatti needed their own statement. The target was 1,000 horsepower, a cost of one million euros, and a top speed over 400 km/h. The engineers thought it was impossible. They failed for eighteen months, Bugatti's project director was fired, and new leadership came in and rebuilt 95% of the car from scratch. Production eventually ran from 2005 to 2015, with 450 total units built.",
      "The W16 engine that powers the Veyron is effectively two 4.0-litre V8s sharing a single crankshaft, a configuration that had never existed before in a production car. To illustrate just how fast this car is: if a Veyron started ten seconds after a McLaren F1, both cars would reach 200 mph at exactly the same time. That gap represents a decade of engineering progress, and the Veyron absorbed all of it. Despite weighing nearly 1,900 kg and producing more power than any F1 car at the time, Matt Prior of Autocar described it as surprisingly easy to drive around town, which is not something easily said about a 1,000 horsepower car. (4) Most high-horsepower cars are difficult to handle in normal conditions and the Veyron made it feel manageable. It was not cheap to run, with all four tires costing around 23,500 pounds and a routine service running 14,000 pounds, more than a Ferrari Enzo's annual bill. But that precision and cost was the point. The world did not need this car. Bugatti brought it anyway, and in doing so it defined its era, the era of record-breaking, luxury, and pure engineering horsepower.",
      '(4) Prior, Matt. "Used Bugatti Veyron 2005-2015 Review." Autocar, August 6, 2014.',
    ],
    captions: [
      { eyebrow: "W16 engine",       line: "Two V8s on one crankshaft. 16 cylinders. Four turbochargers. One road car." },
      { eyebrow: "1,000 horsepower", line: "The engineers said it was impossible. Piech disagreed." },
      { eyebrow: "Autocar, 2014",    line: "220 mph in 30 seconds. The only car Autocar ever measured to that speed." },
      { eyebrow: "1,900 kg",         line: "It handles like a normal car. That is the most impressive part." },
    ],
  },
};

// ============================================================
// Re-emit cars.ts
// ============================================================

function tsString(s: string): string {
  return JSON.stringify(s);
}

function emitCarsFile(): string {
  const header = `export type Car = {
  slug: string;
  name: string;
  maker: string;
  year: number;
  decade: string;
  tagline: string;
  essay: string[];
  stats: { label: string; value: string }[];
  hero: { caption: string };
  images: string[];
  modelUrl?: string;
};

export const cars: Car[] = [
`;
  const blocks = cars.map((car) => {
    const replacement = CONTENT[car.slug];
    const tagline = replacement?.tagline ?? car.tagline;
    const essay = replacement?.essay ?? car.essay;

    const essayBlock = essay.map((p) => `      ${tsString(p)},`).join("\n");
    const statsBlock = car.stats
      .map((s) => `      { label: ${tsString(s.label)}, value: ${tsString(s.value)} },`)
      .join("\n");
    const imagesBlock = car.images
      .map((img) => `      ${tsString(img)},`)
      .join("\n");

    return [
      `  {`,
      `    slug: ${tsString(car.slug)},`,
      `    name: ${tsString(car.name)},`,
      `    maker: ${tsString(car.maker)},`,
      `    year: ${car.year},`,
      `    decade: ${tsString(car.decade)},`,
      `    tagline: ${tsString(tagline)},`,
      `    essay: [`,
      essayBlock,
      `    ],`,
      `    stats: [`,
      statsBlock,
      `    ],`,
      `    hero: { caption: ${tsString(car.hero.caption)} },`,
      car.modelUrl ? `    modelUrl: ${tsString(car.modelUrl)},` : null,
      `    images: [`,
      imagesBlock || "",
      `    ],`,
      `  },`,
    ]
      .filter((x) => x !== null)
      .join("\n");
  }).join("\n");

  const footer = `
];

export const carsBySlug = Object.fromEntries(cars.map((c) => [c.slug, c]));
`;

  return `${header}${blocks}${footer}`;
}

// ============================================================
// Re-emit scenes.ts (only captions change; everything else preserved)
// ============================================================

function emitScenesFile(): string {
  // Read the original to preserve type definitions, header comment, and
  // every per-car field except captions.
  const original = fs.readFileSync(SCENES_PATH, "utf8");

  // Replace each car's captions array. Cars in scenes.ts: countach, 959, f1, veyron.
  // Use a tolerant regex that matches `captions: [\n ... ]` non-greedy
  // within a single car block. Anchor on the slug just before to scope.
  let out = original;
  for (const [slug, content] of Object.entries(CONTENT)) {
    const scene = scenesBySlug[slug];
    if (!scene) continue;

    // Build the new captions array text. Preserve from/to/pos from
    // the existing scene captions (they're position-tied, not text-tied).
    const newCaptions = scene.captions.map((cap, i) => {
      const repl = content.captions[i];
      const eyebrow = repl?.eyebrow ?? cap.eyebrow;
      const line = repl?.line ?? cap.line;
      return `      { from: ${cap.from}, to: ${cap.to}, pos: ${tsString(cap.pos)}, eyebrow: ${tsString(eyebrow)}, line: ${tsString(line)} },`;
    }).join("\n");
    const newBlock = `captions: [\n${newCaptions}\n    ]`;

    // Find the slug-keyed section, then replace the captions array within it.
    const slugQuoted = JSON.stringify(slug);
    // Match: <slugkey>: { ...non-greedy... captions: [ ...non-greedy... ]
    const re = new RegExp(
      `(${escapeRegex(slugQuoted)}\\s*:\\s*\\{[\\s\\S]*?)captions:\\s*\\[[\\s\\S]*?\\]`,
      "m"
    );
    if (!re.test(out)) {
      throw new Error(`Could not locate captions block for slug ${slug} in scenes.ts`);
    }
    out = out.replace(re, `$1${newBlock}`);
  }
  return out;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ============================================================
// Write
// ============================================================

const carsOriginal = fs.readFileSync(CARS_PATH, "utf8");
fs.writeFileSync(`${CARS_PATH}.backup.${TS}`, carsOriginal, "utf8");
fs.writeFileSync(CARS_PATH, emitCarsFile(), "utf8");

const scenesOriginal = fs.readFileSync(SCENES_PATH, "utf8");
fs.writeFileSync(`${SCENES_PATH}.backup.${TS}`, scenesOriginal, "utf8");
fs.writeFileSync(SCENES_PATH, emitScenesFile(), "utf8");

console.log(`✓ Updated ${cars.length} cars.`);
for (const slug of Object.keys(CONTENT)) {
  console.log(`  - ${slug}: tagline + ${CONTENT[slug].essay.length} essay paragraphs (incl. footnote) + ${CONTENT[slug].captions.length} scroll captions`);
}
console.log(`\nBackups:`);
console.log(`  src/lib/cars.ts.backup.${TS}`);
console.log(`  src/lib/scenes.ts.backup.${TS}`);
