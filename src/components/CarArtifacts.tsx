"use client";

import { useCallback, useEffect, useState } from "react";
import type { ArtifactFigure, CarArtifacts } from "@/lib/artifacts";

type LightboxItem = {
  src: string;
  alt: string;
  figId: number;
  caption: string;
  license: string;
  sourceLink: string;
};

export function CarArtifactsSection({ data }: { data: CarArtifacts }) {
  const [lightbox, setLightbox] = useState<LightboxItem | null>(null);

  const openFigure = useCallback((item: ArtifactFigure) => {
    setLightbox({
      src: `/artifacts/${data.imgDir}/${item.filename}`,
      alt: item.alt,
      figId: item.figId,
      caption: item.caption,
      license: item.license,
      sourceLink: item.sourceLink,
    });
  }, [data.imgDir]);

  const close = useCallback(() => setLightbox(null), []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, close]);

  // Walk the mixed list and chunk figures between section headers.
  type Section = { title: string; tierLabel: string; figs: ArtifactFigure[] };
  const sections: Section[] = [];
  let current: Section | null = null;
  for (const item of data.artifacts) {
    if (item.kind === "section") {
      current = { title: item.title, tierLabel: item.tierLabel, figs: [] };
      sections.push(current);
    } else if (current) {
      current.figs.push(item);
    }
  }

  return (
    <section className="artifacts-block mx-auto max-w-[1400px] px-6 lg:px-12 pb-32">
      <div className="artifacts-intro">
        <p>
          The written primary source for this gallery is <em>{data.primarySource.citation}</em>.
          <sup className="fnref">
            <a href="#fn-1">1</a>
          </sup>
        </p>
      </div>

      {sections.map((sec, i) => (
        <div key={i} className="artifact-section">
          <header className="artifact-section-header">
            <div>
              <p className="tier-kicker">{sec.tierLabel}</p>
              <h2 className="section-title">{sec.title}</h2>
            </div>
            <div className="section-count">
              {String(sec.figs.length).padStart(2, "0")} artifact
              {sec.figs.length === 1 ? "" : "s"}
            </div>
          </header>

          <div className="artifact-grid">
            {sec.figs.map((fig, j) => {
              // Editorial varied sizing: every 5th item spans full width; others alternate.
              const span =
                j % 5 === 0 ? "artifact-span-wide" : j % 3 === 1 ? "artifact-span-tall" : "";
              return (
                <ArtifactCard
                  key={fig.figId}
                  fig={fig}
                  imgDir={data.imgDir}
                  onOpen={openFigure}
                  className={span}
                />
              );
            })}
          </div>
        </div>
      ))}

      <section className="footnotes">
        <h3 className="footnotes-heading">Footnotes</h3>
        <ol className="footnotes-list">
          {data.footnotes.map((fn, idx) => (
            <li key={idx} id={`fn-${idx + 1}`} dangerouslySetInnerHTML={{ __html: fnHtml(fn) }} />
          ))}
        </ol>
      </section>

      {lightbox && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={close}>
          <button
            type="button"
            className="lightbox-close"
            aria-label="Close"
            onClick={close}
          >
            ×
          </button>
          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.src} alt={lightbox.alt} />
            <div className="lightbox-caption">
              <span className="lightbox-figlabel">Figure {lightbox.figId}</span>
              <p>
                {lightbox.caption}{" "}
                {lightbox.license && (
                  <span className="caption-license">({lightbox.license})</span>
                )}{" "}
                <a
                  href={lightbox.sourceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="caption-source-link"
                >
                  [Source]
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ArtifactCard({
  fig,
  imgDir,
  onOpen,
  className = "",
}: {
  fig: ArtifactFigure;
  imgDir: string;
  onOpen: (f: ArtifactFigure) => void;
  className?: string;
}) {
  return (
    <figure
      className={`artifact ${className}`}
      id={`fig-${fig.figId}`}
      onClick={() => onOpen(fig)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(fig);
        }
      }}
    >
      <div className="artifact-frame">
        <img src={`/artifacts/${imgDir}/${fig.filename}`} alt={fig.alt} loading="lazy" />
        <span className="artifact-zoom" aria-hidden="true">
          ⤢
        </span>
      </div>
      <figcaption>
        <span className="caption">
          <span className="caption-fig">Figure {fig.figId}.</span> {fig.caption}{" "}
          {fig.license && <span className="caption-license">({fig.license})</span>}{" "}
          <a
            className="caption-source-link"
            href={fig.sourceLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            [Source]
          </a>
          <sup className="fnref">
            <a href={`#fn-${fig.footnoteN}`} onClick={(e) => e.stopPropagation()}>
              {fig.footnoteN}
            </a>
          </sup>
        </span>
        <div className="object-label" data-author="student">
          {/* STUDENT LABEL TEXT, DO NOT WRITE. Placeholder for voice transcript. */}
        </div>
      </figcaption>
    </figure>
  );
}

function fnHtml(s: string): string {
  return s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
}
