"use client";

import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/** Mounts scrubbed parallax transforms on the homepage layout.
 * No DOM — side-effects only. Tag elements with data-parallax and a strength. */
export function HomeParallax() {
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      document
        .querySelectorAll<HTMLElement>("[data-parallax]")
        .forEach((el) => {
          const strength = parseFloat(el.dataset.parallax || "0.15");
          gsap.fromTo(
            el,
            { yPercent: -strength * 20 },
            {
              yPercent: strength * 20,
              ease: "none",
              scrollTrigger: {
                trigger: el.closest("[data-parallax-container]") || el,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.8,
              },
            }
          );
        });

      // Marquee drift: slow horizontal nudge on scroll for a second axis of motion
      document
        .querySelectorAll<HTMLElement>("[data-marquee-drift]")
        .forEach((el) => {
          gsap.fromTo(
            el,
            { xPercent: 0 },
            {
              xPercent: -4,
              ease: "none",
              scrollTrigger: {
                trigger: el,
                start: "top bottom",
                end: "bottom top",
                scrub: 1,
              },
            }
          );
        });
    });

    return () => ctx.revert();
  }, []);

  return null;
}
