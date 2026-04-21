import Link from "next/link";
import { cars } from "@/lib/cars";
import { Reveal } from "@/components/Reveal";
import { ParallaxImage } from "@/components/ParallaxImage";

export default function HomePage() {
  return (
    <>
      {/* Hero — editorial opener */}
      <section className="relative min-h-[92vh] flex flex-col justify-end">
        <div className="absolute inset-0 -z-10">
          <ParallaxImage
            src="/images/countach-01.webp"
            alt="Lamborghini Countach in profile"
            className="absolute inset-0"
            strength={0.3}
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--color-paper)]/30 via-transparent to-[color:var(--color-paper)]" />
        </div>

        <div className="mx-auto max-w-[1400px] w-full px-6 lg:px-12 pb-16 md:pb-24">
          <div className="eyebrow mb-6 text-[color:var(--color-ink)]">Cars Throughout The Decades</div>
          <h1
            className="serif-display max-w-[14ch]"
            style={{ fontSize: "var(--text-display)" }}
          >
            The machines that redrew their decade.
          </h1>
          <p className="mt-8 max-w-xl text-[color:var(--color-ink-muted)] text-[length:var(--text-lede)] leading-snug">
            A permanent exhibit in four rooms. Each one a portrait of a single automobile
            and the moment it shifted the language of the supercar.
          </p>
          <div className="mt-12 flex items-center gap-6 text-[0.8125rem] tracking-[0.16em] uppercase">
            <Link
              href="/countach"
              className="border-b border-[color:var(--color-ink)] pb-1 hover:text-[color:var(--color-brass-dark)] hover:border-[color:var(--color-brass-dark)] transition-colors"
            >
              Enter the gallery
            </Link>
            <span className="text-[color:var(--color-ink-soft)]">/</span>
            <Link
              href="/about"
              className="text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)] transition-colors"
            >
              About the curation
            </Link>
          </div>
        </div>
      </section>

      {/* Curator's note */}
      <section className="mx-auto max-w-[1400px] px-6 lg:px-12 py-32 md:py-48 grid gap-16 md:grid-cols-[1fr_2fr]">
        <Reveal>
          <div className="eyebrow">Curator&apos;s Note</div>
        </Reveal>
        <Reveal delay={120}>
          <p
            className="serif-display text-[color:var(--color-ink)]"
            style={{ fontSize: "var(--text-hero)" }}
          >
            Four automobiles.
            <br />
            Four decades.
            <br />
            <span className="text-[color:var(--color-brass-dark)] italic">
              One long argument about what a car could be.
            </span>
          </p>
          <p className="mt-10 max-w-2xl text-[color:var(--color-ink-muted)] text-[length:var(--text-lede)] leading-relaxed">
            We began with the Countach — because everything that followed was in
            conversation with it. Then the 959, which ended the argument about whether
            computers belonged in sports cars. Then the F1, which answered the argument
            by ignoring it. Finally the Veyron, which insisted the argument was never
            really about speed.
          </p>
        </Reveal>
      </section>

      {/* Exhibits directory */}
      <section className="border-t border-[color:var(--color-rule)]">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12 py-20">
          <Reveal>
            <div className="flex items-end justify-between gap-6 mb-16">
              <h2 className="serif-display" style={{ fontSize: "var(--text-h1)" }}>
                The Exhibits
              </h2>
              <div className="eyebrow pb-2">Four Rooms</div>
            </div>
          </Reveal>

          <ul className="divide-y divide-[color:var(--color-rule)] border-y border-[color:var(--color-rule)]">
            {cars.map((car, i) => (
              <li key={car.slug}>
                <Link
                  href={`/${car.slug}`}
                  className="group grid grid-cols-[4rem_1fr_auto] md:grid-cols-[6rem_1fr_1fr_auto] items-baseline gap-6 py-10 md:py-14 transition-colors hover:bg-[color:var(--color-paper-raised)]"
                >
                  <span className="eyebrow">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="serif-display group-hover:text-[color:var(--color-brass-dark)] group-hover:italic transition-all duration-500"
                    style={{ fontSize: "var(--text-h1)" }}
                  >
                    {car.maker} {car.name}
                  </span>
                  <span className="hidden md:block text-[color:var(--color-ink-muted)] text-[0.9375rem] max-w-sm">
                    {car.tagline}
                  </span>
                  <span className="eyebrow text-right">{car.decade}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
