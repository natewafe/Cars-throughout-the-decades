export type Car = {
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
  {
    slug: "countach",
    name: "Countach",
    maker: "Lamborghini",
    year: 1974,
    decade: "1970s",
    heroHeadline: "The first production car with scissor doors. The shape that defined what a supercar was supposed to look like for the next thirty years.",
    tagline: "Marcello Gandini drew a wedge in 1971, and the supercar has been trying to catch up ever since.",
    essay: [
      "The Lamborghini Countach was a statement of design. Before it, supercars were teardrop-shaped, think old Ferraris and Bugattis, smaller and rounded. The Countach was wide, low, and shaped like a wedge, and it created a new design language that cars are still following today. Bertone designer Marcello Gandini unveiled the LP500 prototype at the 1971 Geneva Motor Show and orders flooded in. Production of the LP400 began in 1974. The car only went into production because founder Ferruccio Lamborghini bet that test driver Bob Wallace could drive the prototype to Sicily and back. If it made it, they would build it. The prototype made it in May 1972. This was the car that truly saved Lamborghini from financial ruin, a company that had started building tractors and was now setting the standard for what an exotic car could be.",
      "As iconic as it looks, the rear wing on the Countach is completely nonfunctional. The engineers zeroed out its angle because it actually made the aerodynamics worse, but customers loved the look. Because Lamborghini could not afford to re-certify the car with a new aero part, completed cars were pulled off the assembly line and into the factory parking lot, where workers bolted the wing on with an electric hand drill, about ten minutes per car. The car also never went through a proper wind tunnel. Engineers taped fabric strips to the body, drove it on the freeway, photographed it, and adjusted the shape based on the pictures. When they ran official top speed tests, they removed the mirrors, altered the suspension, and added intake spacers, anything to beat Ferrari. (3) The rivalry between Lamborghini and Ferrari at the time was fierce, and this car was their weapon.",
      "Production ran for sixteen years, from 1974 to 1990, across five major variants, the LP400, LP400S, LP500S, Quattrovalvole, and the 25th Anniversary edition, which is the white car famously driven in The Wolf of Wall Street. Each revision added more horsepower, wider tires, and more aerodynamic body parts, but each one also moved further from Gandini's original clean and simple design. More recently, Lamborghini released a modern Countach to celebrate the original, a limited-run revival that sold for millions per car, proving that fifty years later the design still speaks for itself. The scissor door became the defining visual symbol of the exotic car. Every supercar has referenced it. The car that was only built because of a bet, whose famous wing was bolted on in a parking lot, ended up being the shape that defined an entire era.",
    ],
    source: "(3) Prince, Max. \"5 Things You Didn't Know About the Lamborghini Countach.\" The Drive, September 19, 2016.",
    stats: [
      { label: "Produced", value: "1974 – 1990" },
      { label: "Engine", value: "3.9–5.2 L V12, mid-mounted" },
      { label: "Top speed", value: "≈ 295 km/h" },
      { label: "Units built", value: "1,983" },
    ],
    hero: { caption: "Lamborghini Countach · 1974–1990 · Sant'Agata Bolognese" },
    modelUrl: "/models/countach.glb",
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
    heroHeadline: "The first production car with computer-controlled all-wheel drive. The first to use sequential turbocharging. The grandfather of every modern performance car.",
    tagline: "Porsche built the future of the supercar, all-wheel drive, sequential turbos, adaptive suspension, in 1986, and lost money on every single one.",
    essay: [
      "The Porsche 959 was a vision of the future disguised as an 1980s car. It was first conceived in 1981 and shown publicly as the \"Gruppe B\" concept in 1983, built to compete in Group B rallying. Porsche needed to sell road-legal versions to homologate it for racing, so only 292 production cars were built from 1986 to 1988. This was not a car built to be profitable. It was a statement. Dave Pankew, writing for Motorsport.com in 2016, describes it as essentially a 911 shell with a ridiculous amount of tech stuffed inside. (2)",
      "What made the 959 so far ahead of its time was how many things it invented at once. The PSK all-wheel drive system had four driver-selectable modes, dry, wet, snow, and ice, and automatically shifted torque between the front and rear wheels depending on grip. The sequential turbocharging system was a world first: a smaller turbo spooled up quickly at low revs for instant power, while the larger turbo came in at higher RPM for full output, producing around 450 horsepower total. There were two dampers per corner, one controlling stiffness and one controlling ride height, which automatically lowered the car at speed. All of this produced a 0 to 60 time of around 3.2 seconds and a top speed of 197 mph in a manual car, in the 1980s. (2) Cars like the Ferrari F40 and the Jaguar XJ220 get more attention from that era, but the Porsche 959 had more technology than both of them combined, and most other manufacturers didn't catch up for decades.",
    ],
    source: "(2) Pankew, Dave. \"Cutaway Classic: Explore the Amazing Porsche 959.\" Motorsport.com, June 8, 2016.",
    stats: [
      { label: "Produced", value: "1986 – 1988" },
      { label: "Engine", value: "2.85 L twin-turbo flat-6" },
      { label: "Top speed", value: "317 km/h" },
      { label: "Units built", value: "292" },
    ],
    hero: { caption: "Porsche 959 · 1986–1988 · Zuffenhausen" },
    modelUrl: "/models/959.glb",
    images: [

    ],
  },
  {
    slug: "f1",
    name: "F1",
    maker: "McLaren",
    year: 1992,
    decade: "1990s",
    heroHeadline: "The first production car with a carbon fiber monocoque chassis. The fastest production car on earth for over a decade.",
    tagline: "The only road car ever designed with zero compromises, no committee, no cost limits, no traction control.",
    essay: [
      "The McLaren F1 was the only road car designed with no compromises. Nobody to answer to, no cost limits, just Gordon Murray's vision of building the purest road car ever made. Murray conceived the idea on a flight home from the 1988 Italian Grand Prix, and the brief was simple: go all out. They spent over five years working on the car, and only 106 were ever made.",
      "What is remarkable is that in the 1990s, this was the car that set the standard for today. The carbon fiber monocoque tub was unheard of in a production car, as most cars of the era were built from fiberglass or aluminum. That construction is now standard on cars from Pagani, McLaren, and even the Alfa Romeo 4C, but the F1 was the first production car to do it. The central driving position, with the driver seated in the middle and two passengers behind, was equally radical. Gordon Murray revisited the concept decades later with the Gordon Murray T.50, and it still stands as one of the most distinctive cockpit designs in automotive history. The engine bay was lined with gold foil, the same material used on spacecraft, to reflect heat away from the V12. Roger Bell, writing for Car Magazine in 1994, drove the car with no minder and no demonstration lap and described how it humbled icons like the Ferrari F40, the Porsche 959, and the Jaguar XJ220, reaching 100 mph in under eight seconds. (1) The top speed record of 391 km/h set in 1998 stood for over a decade before the Bugatti Veyron took it.",
    ],
    source: "(1) Bell, Roger. \"McLaren F1 Review: Our Original 1994 Road Test.\" Car Magazine, June 1994.",
    stats: [
      { label: "Produced", value: "1992 – 1998" },
      { label: "Engine", value: "6.1 L BMW V12" },
      { label: "Top speed", value: "391 km/h" },
      { label: "Units built", value: "106" },
    ],
    hero: { caption: "McLaren F1 · 1992–1998 · Woking" },
    modelUrl: "/models/f1.glb",
    images: [

    ],
  },
  {
    slug: "veyron",
    name: "Veyron",
    maker: "Bugatti",
    year: 2005,
    decade: "2000s",
    heroHeadline: "The first production car to break 400 km/h. The only car Autocar has ever measured to 220 mph.",
    tagline: "Ferdinand Piech set a target his own engineers said was impossible, 1,000 horsepower, 400 km/h, everyday usability, and then made them build it anyway.",
    essay: [
      "Volkswagen Group boss Ferdinand Piech revived the Bugatti brand in the late 1990s with one goal: to build a car that outdid everyone. With cars like the McLaren F1, the Porsche 959, and the Ferrari F40 already setting the benchmark, Bugatti needed their own statement. The target was 1,000 horsepower, a cost of one million euros, and a top speed over 400 km/h. The engineers thought it was impossible. They failed for eighteen months, Bugatti's project director was fired, and new leadership came in and rebuilt 95% of the car from scratch. Production eventually ran from 2005 to 2015, with 450 total units built.",
      "The W16 engine that powers the Veyron is effectively two 4.0-litre V8s sharing a single crankshaft, a configuration that had never existed before in a production car. To illustrate just how fast this car is: if a Veyron started ten seconds after a McLaren F1, both cars would reach 200 mph at exactly the same time. That gap represents a decade of engineering progress, and the Veyron absorbed all of it. Despite weighing nearly 1,900 kg and producing more power than any F1 car at the time, Matt Prior of Autocar described it as surprisingly easy to drive around town, which is not something easily said about a 1,000 horsepower car. (4) Most high-horsepower cars are difficult to handle in normal conditions and the Veyron made it feel manageable. It was not cheap to run, with all four tires costing around 23,500 pounds and a routine service running 14,000 pounds, more than a Ferrari Enzo's annual bill. But that precision and cost was the point. The world did not need this car. Bugatti brought it anyway, and in doing so it defined its era, the era of record-breaking, luxury, and pure engineering horsepower.",
    ],
    source: "(4) Prior, Matt. \"Used Bugatti Veyron 2005-2015 Review.\" Autocar, August 6, 2014.",
    stats: [
      { label: "Produced", value: "2005 – 2015" },
      { label: "Engine", value: "8.0 L quad-turbo W16" },
      { label: "Top speed", value: "408 km/h (431 Super Sport)" },
      { label: "Units built", value: "450" },
    ],
    hero: { caption: "Bugatti Veyron 16.4 · 2005–2015 · Molsheim" },
    modelUrl: "/models/veyron.glb",
    images: [

    ],
  },
];

export const carsBySlug = Object.fromEntries(cars.map((c) => [c.slug, c]));
