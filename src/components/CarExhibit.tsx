import Link from "next/link";
import type { Car } from "@/lib/cars";
import { Reveal } from "./Reveal";
import { CarScrollScene } from "./CarScrollScene";
import { CarArtifactsSection } from "./CarArtifacts";
import { scenesBySlug } from "@/lib/scenes";
import { artifactsBySlug } from "@/lib/artifacts";

export function CarExhibit({ car, next }: { car: Car; next?: Car }) {
  const scene = scenesBySlug[car.slug];
  const artifacts = artifactsBySlug[car.slug];

  return (
    <article className="relative" data-car={car.slug} style={{ isolation: "isolate" }}>
      {/* Scroll-driven 3D scene hero */}
      {scene && car.modelUrl && (
        <CarScrollScene
          modelUrl={car.modelUrl}
          scene={scene}
          nextHref={next ? `/${next.slug}` : undefined}
          nextLabel={next ? `${next.maker} ${next.name}` : undefined}
        />
      )}

      {/* Title band below the scene */}
      <section className="exhibit-after border-y border-[color:var(--color-rule)] bg-[color:var(--color-paper-raised)]">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12 py-14 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="eyebrow">{car.decade} · Exhibit</div>
            <div
              className="mt-4 serif-display text-[color:var(--color-ink)]"
              style={{ fontSize: "var(--text-hero)" }}
            >
              {car.maker} {car.name}
            </div>
            {car.heroHeadline && (
              <div
                className="mt-4 serif-display text-[color:var(--color-ink)] max-w-3xl leading-[1.2]"
                style={{ fontSize: "var(--text-h2)" }}
              >
                {car.heroHeadline}
              </div>
            )}
            <div className="mt-3 text-[color:var(--color-ink-muted)] text-[length:var(--text-lede)] max-w-xl">
              {car.tagline}
            </div>
          </div>
          <div className="eyebrow">{car.hero.caption}</div>
        </div>
      </section>

      {/* STATS BAND */}
      <section className="exhibit-after border-b border-[color:var(--color-rule)] bg-[color:var(--color-paper-raised)]">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {car.stats.map((s) => (
            <Reveal key={s.label}>
              <div>
                <div className="eyebrow">{s.label}</div>
                <div className="mt-2 serif-display text-[length:var(--text-h3)] text-[color:var(--color-ink)]">
                  {s.value}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ESSAY */}
      <section className="exhibit-after mx-auto max-w-[1400px] px-6 lg:px-12 py-24 md:py-32">
        <div className="grid gap-20 md:grid-cols-[1fr_2fr]">
          <Reveal>
            <div className="eyebrow">The Exhibit</div>
            <div className="mt-4 serif-display" style={{ fontSize: "var(--text-h2)" }}>
              {car.maker}
              <br />
              <span className="italic text-[color:var(--color-brass-dark)]">{car.name}</span>
            </div>
          </Reveal>

          <div className="space-y-10">
            {car.essay.map((p, i) => (
              <Reveal key={i} delay={i * 60}>
                <p
                  className={
                    i === 0
                      ? "serif-display text-[color:var(--color-ink)] leading-[1.15]"
                      : "text-[color:var(--color-ink-muted)] leading-relaxed"
                  }
                  style={
                    i === 0
                      ? { fontSize: "var(--text-h2)" }
                      : { fontSize: "var(--text-lede)" }
                  }
                >
                  {p}
                </p>
              </Reveal>
            ))}
            {car.source && (
              <Reveal delay={car.essay.length * 60}>
                <p className="mt-12 pt-6 border-t border-[color:var(--color-rule)] italic text-[color:var(--color-ink-soft)] text-[0.875rem] leading-relaxed">
                  {car.source}
                </p>
              </Reveal>
            )}
          </div>
        </div>
      </section>

      {/* PRIMARY-SOURCE ARTIFACTS + FOOTNOTES */}
      {artifacts && <CarArtifactsSection data={artifacts} />}

      {/* NEXT EXHIBIT */}
      {next && (
        <section className="exhibit-after border-t border-[color:var(--color-rule)]">
          <Link
            href={`/${next.slug}`}
            className="block mx-auto max-w-[1400px] px-6 lg:px-12 py-24 md:py-32 group"
          >
            <div className="eyebrow">Next exhibit</div>
            <div
              className="mt-4 serif-display group-hover:italic group-hover:text-[color:var(--color-brass-dark)] transition-all duration-500"
              style={{ fontSize: "var(--text-hero)" }}
            >
              {next.maker} {next.name} →
            </div>
            <div className="mt-2 text-[color:var(--color-ink-muted)] text-[length:var(--text-lede)]">
              {next.tagline}
            </div>
          </Link>
        </section>
      )}
    </article>
  );
}
