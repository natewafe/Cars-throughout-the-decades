import Link from "next/link";
import { cars } from "@/lib/cars";
import { artifactsBySlug } from "@/lib/artifacts";
import { Reveal } from "@/components/Reveal";
import { WordReveal } from "@/components/home/WordReveal";
import { Marquee } from "@/components/home/Marquee";
import { ExhibitsDirectory } from "@/components/home/ExhibitsDirectory";
import { ArtifactStack } from "@/components/home/ArtifactStack";
import { FourRoomsShowcase, RoomCard } from "@/components/home/FourRoomsShowcase";
import { HomeParallax } from "@/components/home/HomeParallax";
import HomeHero3DClient from "@/components/home/HomeHero3DClient";

function pickArtifacts(slug: string, count: number): string[] {
  const art = artifactsBySlug[slug];
  if (!art) return [];
  const figs = art.artifacts
    .filter((i) => i.kind === "figure")
    .slice(0, count * 2); // leave some variety room
  return figs.slice(0, count).map(
    (f) => `/artifacts/${art.imgDir}/${(f as { filename: string }).filename}`
  );
}

export default function HomePage() {
  // Lead artifact per car for the exhibits-list cursor preview
  const carsWithPreview = cars.map((car) => {
    const art = artifactsBySlug[car.slug];
    let previewImage = car.images[0] || "/images/countach-01.webp";
    if (art) {
      const first = art.artifacts.find((i) => i.kind === "figure");
      if (first && first.kind === "figure") {
        previewImage = `/artifacts/${art.imgDir}/${first.filename}`;
      }
    }
    return { ...car, previewImage };
  });

  // Three featured artifacts per room for the showcase stacks
  const rooms: RoomCard[] = cars.map((car, i) => {
    const three = pickArtifacts(car.slug, 3);
    return {
      slug: car.slug,
      decade: car.decade,
      maker: car.maker,
      name: car.name,
      tagline: car.tagline,
      artifacts: [
        three[0] || "/images/countach-01.webp",
        three[1] || three[0] || "/images/countach-01.webp",
        three[2] || three[0] || "/images/countach-01.webp",
      ] as [string, string, string],
      roomNumber: `Room ${toRoman(i + 1)}`,
    };
  });

  // Three hero stack images — the most "iconic" per car (first from press/launch sections)
  const featuredStack = [
    pickArtifacts("countach", 1)[0],
    pickArtifacts("f1", 1)[0],
    pickArtifacts("veyron", 1)[0],
  ];

  return (
    <>
      <HomeParallax />

      {/* ============ HERO ============ */}
      <section className="home-hero" data-parallax-container>
        <div className="home-hero-top">
          <div className="eyebrow home-hero-kicker">
            <span className="kicker-line" /> A virtual exhibition
          </div>
          <h1
            className="serif-display home-hero-title"
            style={{ fontSize: "var(--text-display)" }}
          >
            <WordReveal as="span" stagger={0.06}>
              The machines that
            </WordReveal>
            <br />
            <WordReveal
              as="span"
              stagger={0.06}
              delay={0.35}
              className="text-[color:var(--color-brass-dark)] italic"
            >
              redrew their decade.
            </WordReveal>
          </h1>
        </div>

        <div className="home-hero-grid">
          <div className="home-hero-copy">
            <p className="home-hero-lede">
              A permanent exhibit in four rooms. Each one a portrait of a single
              automobile and the moment it shifted the language of the supercar.
            </p>

            <div className="home-hero-ctas">
              <Link href="/countach" className="btn-primary">
                <span>Enter the gallery</span>
                <span className="btn-arrow">→</span>
              </Link>
              <Link href="/about" className="btn-ghost">
                About the curation
              </Link>
            </div>

            <div className="home-hero-meta">
              <div>
                <div className="eyebrow">Exhibits</div>
                <div className="meta-value">04</div>
              </div>
              <div>
                <div className="eyebrow">Decades</div>
                <div className="meta-value">1970s → 2000s</div>
              </div>
              <div>
                <div className="eyebrow">Artifacts</div>
                <div className="meta-value">69</div>
              </div>
            </div>
          </div>

          <div className="home-hero-stage" data-parallax="0.25">
            <HomeHero3DClient />
          </div>
        </div>
      </section>

      {/* ============ MARQUEE SIGNATURE ============ */}
      <div data-marquee-drift>
        <Marquee
          items={[
            "1974  Lamborghini Countach",
            "1986  Porsche 959",
            "1992  McLaren F1",
            "2005  Bugatti Veyron",
            "Velocity",
            "Vision",
          ]}
        />
      </div>

      {/* ============ FEATURED ARTIFACT STACK — retro polaroids ============ */}
      <section className="home-featured-stack" data-parallax-container>
        <div className="featured-stack-copy">
          <Reveal>
            <div className="eyebrow">Primary Evidence</div>
            <h2
              className="serif-display mt-4"
              style={{ fontSize: "var(--text-h1)" }}
            >
              Not nostalgia. <br />
              <em className="text-[color:var(--color-brass-dark)]">The shock of first encounter.</em>
            </h2>
            <p className="featured-stack-lede">
              Sixty-nine artifacts, pulled from the original magazine scans,
              press photographs, and auction catalogues that introduced these
              cars to the world. Period voices. Period paper. Period dust.
            </p>
          </Reveal>
        </div>

        <div className="featured-stack-visual" data-parallax="0.12">
          <ArtifactStack
            leftImage={featuredStack[0] || "/images/countach-01.webp"}
            middleImage={featuredStack[1] || "/images/countach-01.webp"}
            rightImage={featuredStack[2] || "/images/countach-01.webp"}
            size="lg"
          />
        </div>
      </section>

      {/* ============ INTRODUCTION ============ */}
      <section className="curator-section">
        <div className="curator-grid">
          <Reveal>
            <div className="eyebrow">Introduction</div>
          </Reveal>

          <div>
            <Reveal delay={100}>
              <p
                className="serif-display curator-pull"
                style={{ fontSize: "var(--text-hero)" }}
              >
                The first car with an electronically controlled all-wheel-drive
                system, automatic tire pressure monitoring, and a 0 to 60 time of
                under 3.5 seconds. You are probably thinking this was created in
                the 2000s, or that it is a Lamborghini you see on the streets
                today. <span className="curator-pull-accent">But no. This was the early 1980s, and Porsche came out with the 959.</span>
              </p>
            </Reveal>
            <Reveal delay={180}>
              <p className="curator-body">
                The McLaren F1, a car with the first carbon fiber cockpit, and the
                same reflective gold lining they used to get us to the moon. You
                would think it was a race car, but this is a road legal supercar
                that broke the record of every car that came before it.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <p className="curator-body">
                The McLaren F1, the Porsche 959, the Lamborghini Countach, and the
                Bugatti Veyron. They all represent a decade. From the 1970s to the
                2000s, they show what defined the modern supercar. They exemplify
                the design elements and technology that we still strive for today,
                the records that were set, the ambitions that were met. They each
                had their own definition of what a supercar was supposed to be,
                and they met it and exceeded it, and that is why we are talking
                about them.
              </p>
            </Reveal>
            <Reveal delay={300}>
              <p className="curator-body">
                The 1970s with the Countach, talking about the drama and the
                presence this car has, redefining the shape that everybody thinks
                of when they picture a modern supercar. The 1980s with the extreme
                technology and pure ambition that the Porsche 959 brought to the
                table. Then the 1990s with the McLaren F1, a car built and
                inspired by racing and design with unlimited budget and ambition,
                a car that met and exceeded every expectation and held its record
                for a decade. Then came the successor, the Bugatti Veyron, a feat
                of engineering, pure adrenaline, and excellence. It beat the
                McLaren F1&apos;s record, but only after 18 months and many failed
                attempts, proving that this was a car that truly showed what
                happens when ambition outlasts doubt. With every car came a peak
                expression of the time period it came from.
              </p>
            </Reveal>
            <Reveal delay={360}>
              <p className="curator-body">
                Every car we are talking about here had a specific person behind
                it with an obsession for creating something so great and so
                powerful that they could not be stopped. Gandini with the
                Lamborghini Countach, the Porsche engineering team, Gordon Murray,
                and Ferdinand Piech. They were all told at some point that it was
                impossible and that it would not be done. But they overcame that,
                whether it was proving to Lamborghini that the prototype could
                survive a drive to Sicily and back, or rebuilding an entire
                engineering team with 95 percent new people in 18 months on the
                Veyron. They specifically proved that throughout each era, a
                supercar could be pushed even further when it seemed like there
                was nowhere left to go, and they all left behind something that
                is still looked at and built upon today.
              </p>
            </Reveal>
            <Reveal delay={420}>
              <p className="curator-body">
                This exhibit explores how each of these cars really did shape
                their decades, not just as a landmark moment in car history, but
                as history itself. A vehicle that tells you about the era it came
                from, the technology it introduced, the design it inspired, the
                status it carried, and the people who dedicated everything to
                bringing it to life.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ FOUR ROOMS SHOWCASE ============ */}
      <FourRoomsShowcase rooms={rooms} />

      {/* ============ EXHIBITS DIRECTORY (textual) ============ */}
      <section className="exhibits-section">
        <div className="exhibits-section-inner">
          <Reveal>
            <header className="exhibits-header">
              <div>
                <p className="eyebrow">The Exhibits, in order</p>
                <h2 className="serif-display" style={{ fontSize: "var(--text-h1)" }}>
                  Four rooms.
                </h2>
              </div>
              <p className="exhibits-caption">
                Hover a row — the lead artifact swaps into the panel on the right.
                Click to enter the room.
              </p>
            </header>
          </Reveal>

          <ExhibitsDirectory cars={carsWithPreview} />
        </div>
      </section>

      {/* ============ CLOSING WORDMARK ============ */}
      <section className="home-wordmark" data-parallax-container>
        <Reveal>
          <h2 className="serif-display home-wordmark-text" data-parallax="0.08">
            <em>Velocity</em> &amp; <em>Vision</em>
          </h2>
          <p className="home-wordmark-sub">
            A small gallery for the automobiles that mattered.
          </p>
        </Reveal>
      </section>
    </>
  );
}

function toRoman(n: number): string {
  return ["I", "II", "III", "IV"][n - 1] || String(n);
}
