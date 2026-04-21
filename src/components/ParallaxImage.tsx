"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";

type Props = {
  src: string;
  alt: string;
  className?: string;
  strength?: number; // 0 - 1
  priority?: boolean;
  sizes?: string;
};

export function ParallaxImage({
  src,
  alt,
  className,
  strength = 0.25,
  priority = false,
  sizes = "100vw",
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const inner = imgRef.current;
    if (!wrap || !inner) return;

    let raf = 0;
    const update = () => {
      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
      const translate = -progress * strength * 100;
      inner.style.transform = `translate3d(0, ${translate}px, 0) scale(1.15)`;
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        update();
        raf = 0;
      });
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [strength]);

  return (
    <div
      ref={wrapRef}
      className={cn("relative overflow-hidden bg-[color:var(--color-paper-raised)]", className)}
    >
      <div ref={imgRef} className="absolute inset-0 will-change-transform">
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover"
        />
      </div>
    </div>
  );
}
