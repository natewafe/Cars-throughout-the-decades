"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Props = {
  children: string;
  as?: "h1" | "h2" | "p" | "span" | "div";
  className?: string;
  style?: React.CSSProperties;
  stagger?: number;
  delay?: number;
  onScroll?: boolean;
};

export function WordReveal({
  children,
  as: Tag = "div",
  className,
  style,
  stagger = 0.05,
  delay = 0,
  onScroll = false,
}: Props) {
  const rootRef = useRef<HTMLElement | null>(null);
  const words = children.split(/(\s+)/);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      const inners = root.querySelectorAll<HTMLElement>(".word-inner");
      const anim = gsap.fromTo(
        inners,
        { yPercent: 110, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
          stagger,
          delay,
          scrollTrigger: onScroll
            ? { trigger: root, start: "top 85%" }
            : undefined,
          paused: false,
        }
      );
      return () => {
        anim.kill();
      };
    }, root);
    return () => ctx.revert();
  }, [children, stagger, delay, onScroll]);

  return (
    <Tag
      ref={rootRef as unknown as React.RefObject<HTMLDivElement>}
      className={className}
      style={style}
    >
      {words.map((w, i) =>
        /\s/.test(w) ? (
          <span key={i}>{w}</span>
        ) : (
          <span key={i} className="word-mask">
            <span className="word-inner">{w}</span>
          </span>
        )
      )}
    </Tag>
  );
}
