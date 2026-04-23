import type { CarArtifacts } from "@/lib/artifacts";

export function CarArtifactsSection({ data }: { data: CarArtifacts }) {
  return (
    <section className="artifacts-block mx-auto max-w-[1100px] px-6 lg:px-12 pb-32">
      <div className="artifacts-intro">
        <p>
          The written primary source for this gallery is <em>{data.primarySource.citation}</em>.
          <sup className="fnref">
            <a href="#fn-1">1</a>
          </sup>
        </p>
      </div>

      {data.artifacts.map((item, i) => {
        if (item.kind === "section") {
          return (
            <header key={`h-${i}`} className="artifacts-section-header">
              <p className="tier-kicker">{item.tierLabel}</p>
              <h2 className="section-title">{item.title}</h2>
            </header>
          );
        }
        return (
          <figure key={item.figId} className="artifact" id={`fig-${item.figId}`}>
            <img
              src={`/artifacts/${data.imgDir}/${item.filename}`}
              alt={item.alt}
              loading="lazy"
            />
            <figcaption>
              <span className="caption">
                Figure {item.figId}. {item.caption}{" "}
                {item.license && (
                  <span className="caption-license">({item.license})</span>
                )}{" "}
                <a
                  className="caption-source-link"
                  href={item.sourceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  [Source]
                </a>
                <sup className="fnref">
                  <a href={`#fn-${item.footnoteN}`}>{item.footnoteN}</a>
                </sup>
              </span>
              <div className="object-label" data-author="student">
                {/* STUDENT LABEL TEXT, DO NOT WRITE. Placeholder for voice transcript. */}
              </div>
            </figcaption>
          </figure>
        );
      })}

      <section className="footnotes">
        <h3 className="footnotes-heading">Footnotes</h3>
        <ol className="footnotes-list">
          {data.footnotes.map((fn, idx) => (
            <li key={idx} id={`fn-${idx + 1}`} dangerouslySetInnerHTML={{ __html: fnHtml(fn) }} />
          ))}
        </ol>
      </section>
    </section>
  );
}

/** Minimal markdown-ish renderer: *italic* into <em>. */
function fnHtml(s: string): string {
  return s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
}
