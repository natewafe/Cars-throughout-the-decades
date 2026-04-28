"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type {
  ArtifactCarousel,
  ArtifactFigure,
  ArtifactItem,
  CarArtifacts,
} from "@/lib/artifacts";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type LightboxItem = {
  src: string;
  citation: string;
  blurb: string;
  license: string;
  url: string;
  pages?: { src: string; caption: string }[];
};

export function CarArtifactsSection({ data }: { data: CarArtifacts }) {
  const [lightbox, setLightbox] = useState<LightboxItem | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const openFigure = useCallback(
    (item: ArtifactFigure) => {
      setPageIndex(0);
      setLightbox({
        src: `/artifacts/${data.imgDir}/${item.filename}`,
        citation: item.citation,
        blurb: item.blurb,
        license: item.license,
        url: item.url,
      });
    },
    [data.imgDir]
  );

  const openCarousel = useCallback(
    (item: ArtifactCarousel) => {
      const pages = item.pages.map((p) => ({
        src: `/artifacts/${data.imgDir}/${p.filename}`,
        caption: p.caption,
      }));
      setPageIndex(0);
      setLightbox({
        src: pages[0]?.src ?? "",
        citation: item.citation,
        blurb: item.blurb,
        license: "",
        url: "",
        pages,
      });
    },
    [data.imgDir]
  );

  const close = useCallback(() => setLightbox(null), []);

  const totalPages = lightbox?.pages?.length ?? 0;
  const goPrev = useCallback(() => {
    if (totalPages > 0) setPageIndex((i) => (i - 1 + totalPages) % totalPages);
  }, [totalPages]);
  const goNext = useCallback(() => {
    if (totalPages > 0) setPageIndex((i) => (i + 1) % totalPages);
  }, [totalPages]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    document.addEventListener("keydown", onKey);
    document.body.classList.add("lightbox-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("lightbox-open");
    };
  }, [lightbox, close, goPrev, goNext]);

  // Scroll-reveal: fade + rise as each artifact enters viewport.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      const figs = root.querySelectorAll<HTMLElement>("figure.artifact, .carousel-card");
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
      });
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

    let pending = false;
    const refresh = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        ScrollTrigger.refresh();
      });
    };
    const imgs = root.querySelectorAll<HTMLImageElement>("img");
    imgs.forEach((img) => {
      if (img.complete) return;
      img.addEventListener("load", refresh, { once: true });
      img.addEventListener("error", refresh, { once: true });
    });
    const settle = window.setTimeout(refresh, 600);

    return () => {
      ctx.revert();
      window.clearTimeout(settle);
    };
  }, [data]);

  // Split into featured (rendered as cards / flippable carousels) and a
  // single flat gallery underneath. No thematic subheadings — every
  // non-featured tile lives in one grid.
  const featured: ArtifactItem[] = data.artifacts.filter((i) => i.featured);
  const gallery: ArtifactItem[] = data.artifacts.filter((i) => !i.featured);

  // Flatten gallery: explode any carousel into individual page tiles.
  const galleryTiles: { key: string; filename: string; citation: string; url: string; license: string }[] = [];
  for (const item of gallery) {
    if (item.kind === "figure") {
      galleryTiles.push({
        key: item.id,
        filename: item.filename,
        citation: item.citation,
        url: item.url,
        license: item.license,
      });
    } else {
      item.pages.forEach((p, i) => {
        galleryTiles.push({
          key: `${item.id}#${i + 1}`,
          filename: p.filename,
          citation: p.caption,
          url: "",
          license: "",
        });
      });
    }
  }

  return (
    <section
      ref={rootRef}
      className="artifacts-block mx-auto max-w-[1400px] px-6 lg:px-12 pb-32"
    >
      <div className="artifacts-intro">
        <p>
          Primary source for this gallery: <em>{data.primarySource.citation}</em>.
        </p>
      </div>

      {/* FEATURED — cards with blurb */}
      {featured.length > 0 && (
        <div className="artifact-section">
          <header className="artifact-section-header">
            <div>
              <p className="tier-kicker">Featured</p>
              <h2 className="section-title">Selected artifacts</h2>
            </div>
            <div className="section-count">
              {String(featured.length).padStart(2, "0")} item{featured.length === 1 ? "" : "s"}
            </div>
          </header>

          <div className="artifact-masonry">
            {featured.map((item) =>
              item.kind === "figure" ? (
                <FigureCard
                  key={item.id}
                  fig={item}
                  imgDir={data.imgDir}
                  onOpen={openFigure}
                  showBlurb
                />
              ) : (
                <CarouselCard
                  key={item.id}
                  item={item}
                  imgDir={data.imgDir}
                  onOpen={openCarousel}
                  showBlurb
                />
              )
            )}
          </div>
        </div>
      )}

      {/* GALLERY — single flat grid, no thematic subheadings. Carousels
          in this layer are exploded into individual page tiles above. */}
      {galleryTiles.length > 0 && (
        <div className="artifact-section">
          <header className="artifact-section-header">
            <div>
              <p className="tier-kicker">Gallery</p>
              <h2 className="section-title">Additional artifacts</h2>
            </div>
            <div className="section-count">
              {String(galleryTiles.length).padStart(2, "0")} image{galleryTiles.length === 1 ? "" : "s"}
            </div>
          </header>

          <div className="artifact-masonry">
            {galleryTiles.map((tile) => (
              <GalleryTile key={tile.key} tile={tile} imgDir={data.imgDir} onOpen={openFigure} />
            ))}
          </div>
        </div>
      )}

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
            {lightbox.pages && lightbox.pages.length > 1 ? (
              <div className="lightbox-carousel">
                <button
                  type="button"
                  className="lightbox-nav lightbox-nav-prev"
                  aria-label="Previous page"
                  onClick={goPrev}
                >
                  ‹
                </button>
                <img
                  src={lightbox.pages[pageIndex].src}
                  alt={lightbox.pages[pageIndex].caption}
                  className="lightbox-carousel-img"
                />
                <button
                  type="button"
                  className="lightbox-nav lightbox-nav-next"
                  aria-label="Next page"
                  onClick={goNext}
                >
                  ›
                </button>
                <div className="lightbox-pageindicator">
                  {pageIndex + 1} / {lightbox.pages.length}
                </div>
              </div>
            ) : (
              <img src={lightbox.src} alt={lightbox.citation} />
            )}
            <div className="lightbox-caption">
              {lightbox.blurb && <p className="lightbox-blurb">{lightbox.blurb}</p>}
              <p className="lightbox-cite">
                {lightbox.citation}
                {lightbox.license && (
                  <>
                    {" "}
                    <span className="caption-license">({lightbox.license})</span>
                  </>
                )}
                {lightbox.url && (
                  <>
                    {" "}
                    <a
                      href={lightbox.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="caption-source-link"
                    >
                      [Source]
                    </a>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function GalleryTile({
  tile,
  imgDir,
  onOpen,
}: {
  tile: { key: string; filename: string; citation: string; url: string; license: string };
  imgDir: string;
  onOpen: (f: ArtifactFigure) => void;
}) {
  // Wrap as a synthetic figure for the lightbox handler.
  const syntheticFig: ArtifactFigure = {
    kind: "figure",
    id: tile.key,
    filename: tile.filename,
    section: "",
    citation: tile.citation,
    url: tile.url,
    license: tile.license,
    featured: false,
    blurb: "",
  };
  return (
    <figure
      className="artifact"
      id={tile.key}
      onClick={() => onOpen(syntheticFig)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(syntheticFig);
        }
      }}
    >
      <div className="artifact-frame">
        <img
          src={`/artifacts/${imgDir}/${tile.filename}`}
          alt={tile.citation}
          loading="lazy"
        />
        <span className="artifact-zoom" aria-hidden="true">⤢</span>
      </div>
      <figcaption>
        <p className="caption">
          {tile.citation}
          {tile.url && (
            <>
              {" "}
              <a
                className="caption-source-link"
                href={tile.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                [Source]
              </a>
            </>
          )}
        </p>
      </figcaption>
    </figure>
  );
}

function FigureCard({
  fig,
  imgDir,
  onOpen,
  showBlurb,
}: {
  fig: ArtifactFigure;
  imgDir: string;
  onOpen: (f: ArtifactFigure) => void;
  showBlurb: boolean;
}) {
  return (
    <figure
      className="artifact"
      id={fig.id}
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
        <img
          src={`/artifacts/${imgDir}/${fig.filename}`}
          alt={fig.citation}
          loading="lazy"
        />
        <span className="artifact-zoom" aria-hidden="true">⤢</span>
      </div>
      <figcaption>
        {showBlurb && fig.blurb && <p className="artifact-blurb">{fig.blurb}</p>}
        <p className="caption">
          {fig.citation}
          {fig.license && (
            <>
              {" "}
              <span className="caption-license">({fig.license})</span>
            </>
          )}
          {fig.url && (
            <>
              {" "}
              <a
                className="caption-source-link"
                href={fig.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                [Source]
              </a>
            </>
          )}
        </p>
      </figcaption>
    </figure>
  );
}

function CarouselCard({
  item,
  imgDir,
  onOpen,
  showBlurb,
}: {
  item: ArtifactCarousel;
  imgDir: string;
  onOpen: (c: ArtifactCarousel) => void;
  showBlurb: boolean;
}) {
  const cover = item.pages[0];
  return (
    <figure
      className="artifact carousel-card"
      id={item.id}
      onClick={() => onOpen(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(item);
        }
      }}
    >
      <div className="artifact-frame">
        {cover && (
          <img
            src={`/artifacts/${imgDir}/${cover.filename}`}
            alt={item.title}
            loading="lazy"
          />
        )}
        <span className="artifact-zoom" aria-hidden="true">⤢</span>
        <span className="carousel-badge">{item.pages.length} pages</span>
      </div>
      <figcaption>
        <p className="artifact-blurb carousel-title">{item.title}</p>
        {showBlurb && item.blurb && <p className="artifact-blurb">{item.blurb}</p>}
        <p className="caption">{item.citation}</p>
      </figcaption>
    </figure>
  );
}
