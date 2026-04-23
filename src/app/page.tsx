import Link from "next/link";
import { cars } from "@/lib/cars";
import { artifactsBySlug } from "@/lib/artifacts";
import { Reveal } from "@/components/Reveal";
import { WordReveal } from "@/components/home/WordReveal";
import { Marquee } from "@/components/home/Marquee";
import { ExhibitsDirectory } from "@/components/home/ExhibitsDirectory";
import HomeHero3DClient from "@/components/home/HomeHero3DClient";

export default function HomePage() {
  // Pick a lead artifact image per car for the cursor-follow preview on the exhibits list
  const carsWithPreview = cars.map((car) => {
    const slugForArtifacts =
      car.slug === "959" ? "959"
      : car.slug === "f1" ? "f1"
      : car.slug;
    const art = artifactsBySlug[slugForArtifacts];
    // Take the first figure as the preview
    let previewImage = car.images[0] || "/images/countach-01.webp";
    if (art) {
      const firstFig = art.artifacts.find((i) => i.kind === "figure");
      if (firstFig && firstFig.kind === "figure") {
        previewImage = `/artifacts/${art.imgDir}/${firstFig.filename}`;
      }
    }
    return { ...car, previewImage };
  });

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="home-hero">
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

          <div className="home-hero-stage">
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

      {/* ============ EXHIBITS DIRECTORY ============ */}
      <section className="exhibits-section">
        <div className="exhibits-section-inner">
          <Reveal>
            <header className="exhibits-header">
              <div>
                <p className="eyebrow">The Exhibits</p>
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
      <section className="home-wordmark">
        <Reveal>
          <h2 className="serif-display home-wordmark-text">
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
