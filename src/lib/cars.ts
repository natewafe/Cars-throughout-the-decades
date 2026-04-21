export type Car = {
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
  {
    slug: "countach",
    name: "Countach",
    maker: "Lamborghini",
    year: 1974,
    decade: "1970s",
    tagline: "The wedge that redefined the supercar silhouette.",
    essay: [
      "Revealed in 1971 as the LP500 concept and produced from 1974, the Countach crystallised a new language for the supercar: scissor doors, knife-edge surfaces, and a mid-mounted V12 placed longitudinally — giving the car its full name, Longitudinale Posteriore.",
      "Marcello Gandini's drawing rejected the sensuous curves of the Miura that came before it. Where the Miura flowed, the Countach cut. The cabin perched ahead of the engine, the nose dropped to the road, the tail splayed into intakes that fed twelve hungry cylinders.",
      "Across nearly two decades of production, the Countach progressed from the pure LP400 through the widened LP500 S, the four-valve Quattrovalvole, and the thirtieth-anniversary 25th Anniversary edition. Each revision added flare and horsepower; each compromised a little of Gandini's pristine original.",
    ],
    stats: [
      { label: "Produced", value: "1974 – 1990" },
      { label: "Engine", value: "3.9–5.2 L V12, mid-mounted" },
      { label: "Top speed", value: "≈ 295 km/h" },
      { label: "Units built", value: "1,983" },
    ],
    hero: { caption: "Lamborghini Countach · 1974–1990 · Sant'Agata Bolognese" },
    images: [
      "/images/countach-01.webp",
      "/images/countach-02.webp",
      "/images/countach-03.webp",
      "/images/countach-04.webp",
    ],
  },
  {
    slug: "959",
    name: "959",
    maker: "Porsche",
    year: 1986,
    decade: "1980s",
    tagline: "A road-legal prototype that invented the modern supercar.",
    essay: [
      "The 959 was Porsche's answer to a question no one else had yet asked: what if the cutting edge of motorsport could drive itself to the grocery store? Developed for Group B rallying and homologated for the road, the 959 bundled twin-turbo flat-six engineering with computer-controlled all-wheel drive, adaptive suspension, and run-flat tires with internal pressure sensors — years before any of those things were ordinary.",
      "Only 292 production cars were built between 1986 and 1988. Each one was hand-assembled. Each one lost Porsche money. Each one rewrote the rules.",
    ],
    stats: [
      { label: "Produced", value: "1986 – 1988" },
      { label: "Engine", value: "2.85 L twin-turbo flat-6" },
      { label: "Top speed", value: "317 km/h" },
      { label: "Units built", value: "292" },
    ],
    hero: { caption: "Porsche 959 · 1986–1988 · Zuffenhausen" },
    images: [],
  },
  {
    slug: "f1",
    name: "F1",
    maker: "McLaren",
    year: 1992,
    decade: "1990s",
    tagline: "Gordon Murray's uncompromised love letter to the driver.",
    essay: [
      "No committee designed the McLaren F1. Gordon Murray sketched it on a whiteboard after a long flight home from the 1988 Italian Grand Prix, and the brief was simple: build the purest road car ever made, and accept no compromise to reach it.",
      "The cabin seats three, with the driver centered. The tub is carbon fiber — a first for a production car. The engine bay is lined with gold foil, the best available heat reflector. BMW supplied a naturally-aspirated 6.1-litre V12 specifically engineered to Murray's weight target. The result, in 1998, set a production-car speed record of 391 km/h that stood for more than a decade.",
    ],
    stats: [
      { label: "Produced", value: "1992 – 1998" },
      { label: "Engine", value: "6.1 L BMW V12" },
      { label: "Top speed", value: "391 km/h" },
      { label: "Units built", value: "106" },
    ],
    hero: { caption: "McLaren F1 · 1992–1998 · Woking" },
    images: [],
  },
  {
    slug: "veyron",
    name: "Veyron",
    maker: "Bugatti",
    year: 2005,
    decade: "2000s",
    tagline: "1001 horsepower, delivered in a three-piece suit.",
    essay: [
      "When Volkswagen revived Bugatti in the late 1990s, Ferdinand Piëch set an engineering target so extreme that most of his team thought it impossible: 1001 metric horsepower, a top speed above 400 km/h, and the comfort of a fine grand tourer. The Veyron 16.4 delivered all three in 2005.",
      "Its quad-turbocharged W16 drew air through ten radiators. At maximum speed, the tyres were rated for fifteen minutes of use. A special key unlocked the final rear wing configuration. Every Veyron was hand-built at the Atelier in Molsheim, each taking several weeks.",
    ],
    stats: [
      { label: "Produced", value: "2005 – 2015" },
      { label: "Engine", value: "8.0 L quad-turbo W16" },
      { label: "Top speed", value: "408 km/h (431 Super Sport)" },
      { label: "Units built", value: "450" },
    ],
    hero: { caption: "Bugatti Veyron 16.4 · 2005–2015 · Molsheim" },
    images: [],
  },
];

export const carsBySlug = Object.fromEntries(cars.map((c) => [c.slug, c]));
