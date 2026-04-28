import { Reveal } from "@/components/Reveal";
import { bibliography } from "@/lib/bibliography";

export const metadata = {
  title: "About — The Motor Gallery",
  description: "About The Motor Gallery and the curation of cars through the decades.",
};

function fmtBib(s: string) {
  // Escape HTML first so user-supplied entries can't inject markup.
  const escaped = s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return (
    escaped
      // *italic* → <em>italic</em>
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      // Promote bare URLs to clickable links. Trailing punctuation
      // (period, comma, semi) is kept outside the anchor so sentences
      // still terminate cleanly.
      .replace(
        /(https?:\/\/[^\s<>"]+?)(?=[)\].,;]?(?:\s|$))/g,
        '<a href="$1" target="_blank" rel="noopener" class="bib-link">$1</a>'
      )
  );
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

      <Reveal delay={200}>
        <p className="mt-8 max-w-3xl text-[length:var(--text-lede)] leading-relaxed text-[color:var(--color-ink-muted)]">
          Four machines, one per decade, chosen because each one forced the rest of
          the industry to answer a new question. The full introduction lives on the
          home page; what follows is the closing argument.
        </p>
      </Reveal>

      {/* CONCLUSION */}
      <div className="mt-24 grid gap-20 md:grid-cols-[1fr_2fr] border-t border-[color:var(--color-rule)] pt-20">
        <Reveal>
          <div className="sticky top-32">
            <div className="eyebrow">Conclusion</div>
            <p className="mt-4 text-[color:var(--color-ink-muted)] leading-relaxed">
              Forty years, four cars, one word.
            </p>
          </div>
        </Reveal>

        <div className="space-y-8 text-[length:var(--text-lede)] leading-relaxed text-[color:var(--color-ink-muted)]">
          <Reveal>
            <p className="serif-display text-[color:var(--color-ink)]" style={{ fontSize: "var(--text-h2)" }}>
              Across 40 years, these four cars share one word: impossible. Before
              each of them existed, someone said it could not be done. They all came
              from nothing, pushed by one person or one team who refused to accept
              that answer, the way all great ideas do.
            </p>
          </Reveal>
          <Reveal delay={80}>
            <p>
              And now look at what they left behind. The wedge shape of the modern
              supercar started with the Countach. The doors that go up. The tire
              pressure monitoring system in your Subaru Outback traces back to the
              Porsche 959. The power and performance race happening today between
              Rimac, Koenigsegg, and Bugatti is a direct continuation of what these
              four cars started. The McLaren F1 competed at Le Mans and won from an
              idea Gordon Murray had on a flight home. The hypercar category itself
              was defined by these cars, and it started, really, with the Countach.
            </p>
          </Reveal>
          <Reveal delay={160}>
            <p>
              They are not just cars. They might be to some people, but they are
              documents of human ambition at specific points in time, a record of
              what we believed could be achieved on the road. All four of them were
              significant financial losses for the companies that built them. But
              the Countach still pulled Lamborghini out of a hole, because it
              brought a presence to their brand that money alone could not buy. The
              world did not ask for any of these cars, but they gave them to us
              anyway, and that is exactly why they matter.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <p>
              You might not be a car person, but you can respect the human
              engineering and pure ambition that went into trying to break 400
              kilometers an hour, into building a car with sequential turbos and a
              computer controlled all-wheel-drive system in 1986, into lining an
              engine bay with gold and putting the driver in the center because that
              is what the physics demanded. These cars were not built for the
              market. They were built because someone believed the next version of
              impossible was worth chasing.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <p
              className="serif-display text-[color:var(--color-ink)] italic"
              style={{ fontSize: "var(--text-h2)" }}
            >
              The inevitable future was defined inside these cars.
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
