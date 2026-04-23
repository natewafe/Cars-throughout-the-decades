"use client";

import Link from "next/link";
import { useState } from "react";
import type { Car } from "@/lib/cars";

type CarWithPreview = Car & { previewImage: string };

/** Textual exhibits list with a stable, side-pinned preview panel.
 * Hovering a row cross-fades the preview to that car's lead artifact.
 * No cursor tracking, no RAF, no mouse-move math — just a ring of <img>s
 * with opacity transitions. Every image is in the DOM at mount so there is
 * no pop-in. Below 900px the preview hides and rows render full-width. */
export function ExhibitsDirectory({ cars }: { cars: CarWithPreview[] }) {
  const [activeSlug, setActiveSlug] = useState<string>(cars[0]?.slug ?? "");

  return (
    <div className="exhibits-directory">
      <div className="exhibits-preview-pin" aria-hidden="true">
        {cars.map((c) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={c.slug}
            src={c.previewImage}
            alt=""
            loading="lazy"
            decoding="async"
            className={`exhibits-preview-img${c.slug === activeSlug ? " is-live" : ""}`}
          />
        ))}
      </div>

      <ul className="exhibits-list">
        {cars.map((car, i) => (
          <li key={car.slug}>
            <Link
              href={`/${car.slug}`}
              className="exhibit-row group"
              onMouseEnter={() => setActiveSlug(car.slug)}
              onFocus={() => setActiveSlug(car.slug)}
            >
              <span className="exhibit-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="exhibit-title">
                <span className="exhibit-maker">{car.maker}</span>{" "}
                <span className="exhibit-name">{car.name}</span>
              </span>
              <span className="exhibit-tagline">{car.tagline}</span>
              <span className="exhibit-decade">{car.decade}</span>
              <span className="exhibit-arrow" aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
