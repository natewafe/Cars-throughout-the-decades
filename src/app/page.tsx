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
        <div className="home-hero-grid">
          <div className="home-hero-copy">
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
                <div className="meta-value">1970 → 2010</div>
              </div>
              <div>
                <div className="eyebrow">Artifacts</div>
                <div className="meta-value">69</div>
              </div>
            </div>
          </div>

          <div className="home-hero-stage" data-parallax="0.25">
            <HomeHero3DClient />
            <div className="home-hero-stage-label">
              <span className="eyebrow">Now Showing · Room I</span>
              <span className="stage-title">Lamborghini Countach LP400</span>
              <span className="stage-meta">Italy · 1974 → 1990</span>
            </div>
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

      {/* ============ CURATOR'S NOTE ============ */}
      <section className="curator-section">
        <div className="curator-grid">
          <Reveal>
            <div className="eyebrow">Curator&apos;s Note</div>
          </Reveal>

          <div>
            <Reveal delay={100}>
              <p
                className="serif-display curator-pull"
                style={{ fontSize: "var(--text-hero)" }}
              >
                Four automobiles.
                <br />
                Four decades.
                <br />
                <span className="curator-pull-accent">
                  One long argument about what a car could be.
                </span>
              </p>
            </Reveal>
            <Reveal delay={220}>
              <p className="curator-body">
                We began with the <em>Countach</em>, because everything that followed was
                in conversation with it. Then the <em>959</em>, which ended the argument
                about whether computers belonged in sports cars. Then the{" "}
                <em>McLaren F1</em>, which answered the argument by ignoring it. Finally
                the <em>Veyron</em>, which insisted the argument was never really about
                speed.
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
                Hover a row to glimpse the lead artifact. Click to enter the room.
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
