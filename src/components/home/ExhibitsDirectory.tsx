"use client";

import Link from "next/link";
import { useRef, useState, useCallback, useEffect } from "react";
import type { Car } from "@/lib/cars";

type CarWithPreview = Car & { previewImage: string };

export function ExhibitsDirectory({ cars }: { cars: CarWithPreview[] }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [activeSrc, setActiveSrc] = useState<string | null>(null);
  const pos = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const rafId = useRef<number | null>(null);

  const onMove = useCallback((e: React.MouseEvent) => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    pos.current.tx = e.clientX - rect.left;
    pos.current.ty = e.clientY - rect.top;
  }, []);

  useEffect(() => {
    const tick = () => {
      pos.current.x += (pos.current.tx - pos.current.x) * 0.18;
      pos.current.y += (pos.current.ty - pos.current.y) * 0.18;
      if (previewRef.current) {
        previewRef.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%)`;
      }
      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="exhibits-directory"
      onMouseMove={onMove}
      onMouseLeave={() => setActiveSrc(null)}
    >
      <div
        ref={previewRef}
        className={`exhibits-preview ${activeSrc ? "is-live" : ""}`}
        aria-hidden="true"
      >
        {activeSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={activeSrc} alt="" />
        )}
      </div>

      <ul className="exhibits-list">
        {cars.map((car, i) => (
          <li key={car.slug}>
            <Link
              href={`/${car.slug}`}
              className="exhibit-row group"
              onMouseEnter={() => setActiveSrc(car.previewImage)}
              onFocus={() => setActiveSrc(car.previewImage)}
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
