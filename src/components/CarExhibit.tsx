"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Car } from "@/lib/cars";
import { Reveal } from "./Reveal";
import { ParallaxImage } from "./ParallaxImage";

const CarModel = dynamic(
  () => import("./CarModel").then((m) => m.CarModel),
  { ssr: false }
);

export function CarExhibit({ car, next }: { car: Car; next?: Car }) {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const [heroProgress, setHeroProgress] = useState(0);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        const scrolled = Math.max(0, Math.min(1, -rect.top / Math.max(1, total)));
        setHeroProgress(scrolled);
        raf = 0;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <article className="relative">
      {/* HERO — pinned 3D model with editorial title */}
      <section
        ref={heroRef}
        className="relative h-[200vh]"
      >
        <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-hidden">
          {/* 3D stage */}
          <div
            className="absolute inset-0"
            style={{
              opacity: 1 - heroProgress * 0.6,
              transform: `scale(${1 - heroProgress * 0.05})`,
            }}
          >
            <CarModel accent="#b07a2b" />
          </div>

          {/* Title overlay */}
          <div className="relative h-full mx-auto max-w-[1400px] px-6 lg:px-12 flex flex-col justify-between py-10 pointer-events-none">
            <div className="flex items-baseline justify-between gap-6">
              <div className="eyebrow">
                {car.decade} · Exhibit
              </div>
              <div className="eyebrow">
                {car.year}
              </div>
            </div>

            <div>
              <div
                className="serif-display text-[color:var(--color-ink)]"
                style={{
                  fontSize: "var(--text-display)",
                  transform: `translateY(${heroProgress * -40}px)`,
                  opacity: 1 - heroProgress * 0.8,
                }}
              >
                {car.name}
              </div>
              <div
                className="mt-4 max-w-xl text-[color:var(--color-ink-muted)] text-[length:var(--text-lede)] leading-snug"
                style={{
                  transform: `translateY(${heroProgress * -20}px)`,
                  opacity: 1 - heroProgress * 0.9,
                }}
              >
                {car.tagline}
              </div>
              <div className="mt-6 eyebrow">{car.hero.caption}</div>
            </div>

            <div />
          </div>
        </div>
      </section>

      {/* STATS BAND */}
      <section className="border-y border-[color:var(--color-rule)] bg-[color:var(--color-paper-raised)]">
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

      {/* ESSAY + IMAGES — interleaved editorial */}
      <section className="mx-auto max-w-[1400px] px-6 lg:px-12 py-32 md:py-40">
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
          </div>
        </div>
      </section>

      {/* IMAGE SEQUENCE — parallax reveal */}
      {car.images.length > 0 ? (
        <section className="space-y-32 md:space-y-48 pb-32">
          {car.images.map((src, i) => {
            const isWide = i % 3 === 0;
            const isOffset = i % 2 === 1;
            return (
              <Reveal key={src}>
                <figure
                  className={
                    isWide
                      ? "mx-auto max-w-[1600px] px-0"
                      : `mx-auto max-w-[1100px] px-6 ${isOffset ? "md:ml-[12%] md:mr-0" : "md:mr-[12%] md:ml-0"}`
                  }
                >
                  <ParallaxImage
                    src={src}
                    alt={`${car.maker} ${car.name} — plate ${i + 1}`}
                    className={isWide ? "aspect-[21/9]" : "aspect-[4/5] md:aspect-[3/4]"}
                    strength={0.2}
                    sizes="(min-width: 1280px) 1100px, 100vw"
                  />
                  <figcaption className="mt-4 eyebrow text-[color:var(--color-ink-soft)]">
                    Plate {String(i + 1).padStart(2, "0")} · {car.maker} {car.name}
                  </figcaption>
                </figure>
              </Reveal>
            );
          })}
        </section>
      ) : (
        <section className="mx-auto max-w-[1400px] px-6 lg:px-12 pb-32">
          <Reveal>
            <div className="border border-dashed border-[color:var(--color-rule)] rounded-none p-16 md:p-24 text-center">
              <div className="eyebrow">Awaiting Acquisitions</div>
              <p className="mt-6 serif-display text-[length:var(--text-h2)] max-w-xl mx-auto leading-tight">
                Photographic plates for this exhibit are being prepared.
              </p>
              <p className="mt-4 text-[color:var(--color-ink-muted)] max-w-md mx-auto">
                Drop <code className="font-mono text-[0.8125rem]">.webp</code> files into{" "}
                <code className="font-mono text-[0.8125rem]">public/images/</code> and list them in{" "}
                <code className="font-mono text-[0.8125rem]">src/lib/cars.ts</code>.
              </p>
            </div>
          </Reveal>
        </section>
      )}

      {/* NEXT EXHIBIT */}
      {next && (
        <section className="border-t border-[color:var(--color-rule)]">
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

      {/* Preload first image */}
      {car.images[0] && (
        <Image
          src={car.images[0]}
          alt=""
          width={1}
          height={1}
          aria-hidden
          style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
        />
      )}
    </article>
  );
}
