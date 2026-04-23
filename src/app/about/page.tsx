import { Reveal } from "@/components/Reveal";
import { bibliography } from "@/lib/bibliography";

export const metadata = {
  title: "About — The Motor Gallery",
  description: "About The Motor Gallery and the curation of cars through the decades.",
};

function fmtBib(s: string) {
  return s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-[1400px] px-6 lg:px-12 py-24 md:py-32">
      <Reveal>
        <div className="eyebrow">About the gallery</div>
      </Reveal>

      <Reveal delay={120}>
        <h1
          className="mt-6 serif-display max-w-[18ch]"
          style={{ fontSize: "var(--text-hero)" }}
        >
          A small gallery for the automobiles that mattered.
        </h1>
      </Reveal>

      <div className="mt-20 grid gap-20 md:grid-cols-[2fr_3fr]">
        <Reveal>
          <div className="sticky top-32">
            <div className="eyebrow">Curation</div>
            <p className="mt-4 text-[color:var(--color-ink-muted)] leading-relaxed">
              Four machines, one per decade, chosen because each one forced the rest of
              the industry to answer a new question.
            </p>
          </div>
        </Reveal>

        <div className="space-y-8 text-[length:var(--text-lede)] leading-relaxed text-[color:var(--color-ink-muted)]">
          <Reveal>
            <p className="serif-display text-[color:var(--color-ink)]" style={{ fontSize: "var(--text-h2)" }}>
              The automobile is the twentieth century&apos;s most looked-at sculpture.
            </p>
          </Reveal>
          <Reveal delay={80}>
            <p>
              We treat it that way. Each exhibit presents a single car in the way a
              museum would present a single canvas: a long look, a few careful words,
              the room quiet enough to hear the engineering.
            </p>
          </Reveal>
          <Reveal delay={160}>
            <p>
              The collection is deliberately small. A larger survey would obscure the
              argument. Four cars over four decades, the Countach, the 959, the
              McLaren F1, the Veyron, tell the whole story of what the supercar
              became, and why.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <p>
              Photography, essays, and three-dimensional studies are produced in-house.
              Technical data is drawn from contemporary press kits and manufacturer
              homologation documents. When a detail is disputed, we say so.
            </p>
          </Reveal>
        </div>
      </div>

      <div className="mt-32 grid md:grid-cols-3 gap-12 border-t border-[color:var(--color-rule)] pt-16">
        {[
          { label: "Hours", value: "By appointment" },
          { label: "Location", value: "Digital, for now" },
          { label: "Correspondence", value: "Always welcome" },
        ].map((item) => (
          <Reveal key={item.label}>
            <div>
              <div className="eyebrow">{item.label}</div>
              <div className="mt-3 serif-display text-[length:var(--text-h3)]">
                {item.value}
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Consolidated bibliography */}
      <section
        id="bibliography"
        className="mt-32 pt-16 border-t border-[color:var(--color-rule)]"
      >
        <Reveal>
          <div className="eyebrow">Bibliography</div>
          <h2 className="mt-4 serif-display" style={{ fontSize: "var(--text-h1)" }}>
            Primary-source artifacts cited across the four galleries.
          </h2>
          <p className="mt-4 text-[color:var(--color-ink-muted)] max-w-2xl">
            Every image and text deduplicated and alphabetized by author. Chicago style.
          </p>
        </Reveal>

        <ol className="mt-12 space-y-5 text-[color:var(--color-ink-muted)] leading-relaxed">
          {bibliography.map((entry, i) => (
            <li
              key={i}
              className="pl-6 -indent-6 text-[0.95rem]"
              dangerouslySetInnerHTML={{ __html: fmtBib(entry) }}
            />
          ))}
        </ol>
      </section>
    </article>
  );
}
