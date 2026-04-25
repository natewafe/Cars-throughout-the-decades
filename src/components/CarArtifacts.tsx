"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ArtifactFigure, CarArtifacts } from "@/lib/artifacts";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type LightboxItem = {
  src: string;
  alt: string;
  figId: number;
  caption: string;
  blurb: string;
  license: string;
  sourceLink: string;
};

export function CarArtifactsSection({ data }: { data: CarArtifacts }) {
  const [lightbox, setLightbox] = useState<LightboxItem | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const openFigure = useCallback(
    (item: ArtifactFigure) => {
      setLightbox({
        src: `/artifacts/${data.imgDir}/${item.filename}`,
        alt: item.alt,
        figId: item.figId,
        caption: item.caption,
        blurb: item.blurb,
        license: item.license,
        sourceLink: item.sourceLink,
      });
    },
    [data.imgDir]
  );

  const close = useCallback(() => setLightbox(null), []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    // Mark a class so CSS can freeze background scroll WITHOUT touching
    // body.style.overflow — Lenis runs its own scroll engine; setting
    // `overflow: hidden` directly on body desyncs Lenis's virtual position
    // and the page scroll won't recover after closing the lightbox (this
    // was contributing to the "scroll dies partway down" bug).
    document.body.classList.add("lightbox-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("lightbox-open");
    };
  }, [lightbox, close]);

  // Scroll-reveal: fade + rise as each figure enters viewport.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      const figs = root.querySelectorAll<HTMLElement>("figure.artifact");
      figs.forEach((fig) => {
        gsap.fromTo(
          fig,
          { autoAlpha: 0, y: 40 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: fig,
              start: "top 88%",
              end: "top 55%",
              toggleActions: "play none none reverse",
            },
          }
        );
        // subtle parallax drift inside the frame as figure moves through viewport
        const img = fig.querySelector<HTMLElement>(".artifact-frame img");
        if (img) {
          gsap.fromTo(
            img,
            { yPercent: -4 },
            {
              yPercent: 4,
              ease: "none",
              scrollTrigger: {
                trigger: fig,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.8,
              },
            }
          );
        }
      });
      // Section header underline fill on enter
      root.querySelectorAll<HTMLElement>(".artifact-section-header").forEach((hdr) => {
        gsap.fromTo(
          hdr,
          { "--hdr-line": 0 } as gsap.TweenVars,
          {
            "--hdr-line": 1,
            duration: 1.2,
            ease: "power2.out",
            scrollTrigger: { trigger: hdr, start: "top 85%" },
          } as gsap.TweenVars
        );
      });
    }, root);

    // CRITICAL: lazy artifact images grow the page after the pin spacer for
    // CarScrollScene is sized. ScrollTrigger then thinks the document ends
    // earlier than it actually does — scroll feels "stuck" about 2/3 down,
    // because Lenis caps virtual scroll at the (stale) computed end. Refresh
    // every time an image finishes loading. Throttled via rAF coalescing so
    // 70+ images don't trigger 70 refreshes back-to-back.
    let pending = false;
    const scheduleRefresh = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        ScrollTrigger.refresh();
      });
    };
    const imgs = root.querySelectorAll<HTMLImageElement>("figure.artifact img");
    imgs.forEach((img) => {
      if (img.complete) return;
      img.addEventListener("load", scheduleRefresh, { once: true });
      img.addEventListener("error", scheduleRefresh, { once: true });
    });
    // Also schedule one final refresh after the first paint settles.
    const settleId = window.setTimeout(scheduleRefresh, 600);

    return () => {
      ctx.revert();
      window.clearTimeout(settleId);
      imgs.forEach((img) => {
        img.removeEventListener("load", scheduleRefresh);
        img.removeEventListener("error", scheduleRefresh);
      });
    };
  }, [data]);

  // Group figures by section header
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
    <section
      ref={rootRef}
      className="artifacts-block mx-auto max-w-[1400px] px-6 lg:px-12 pb-32"
    >
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

          {/* CSS columns give a masonry that preserves every image's natural aspect ratio */}
          <div className="artifact-masonry">
            {sec.figs.map((fig) => (
              <ArtifactCard
                key={fig.figId}
                fig={fig}
                imgDir={data.imgDir}
                onOpen={openFigure}
              />
            ))}
          </div>
        </div>
      ))}

      <section className="footnotes">
        <h3 className="footnotes-heading">Footnotes</h3>
        <ol className="footnotes-list">
          {data.footnotes.map((fn, idx) => (
            <li
              key={idx}
              id={`fn-${idx + 1}`}
              dangerouslySetInnerHTML={{ __html: fnHtml(fn) }}
            />
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
              {lightbox.blurb && <p className="lightbox-blurb">{lightbox.blurb}</p>}
              <p className="lightbox-cite">
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
}: {
  fig: ArtifactFigure;
  imgDir: string;
  onOpen: (f: ArtifactFigure) => void;
}) {
  // Placeholder blurb (editable later per figure)
  const blurb = fig.blurb || "[Your note goes here.]";
  return (
    <figure
      className="artifact"
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
        <span className="caption-fig">Figure {fig.figId}</span>
        <p className="artifact-blurb">{blurb}</p>
        <p className="caption">
          {fig.caption}{" "}
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
        </p>
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
