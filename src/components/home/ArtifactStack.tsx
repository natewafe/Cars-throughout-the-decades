"use client";

import { motion, Variants } from "motion/react";

type Props = {
  leftImage: string;
  middleImage: string;
  rightImage: string;
  leftCaption?: string;
  middleCaption?: string;
  rightCaption?: string;
  size?: "sm" | "md" | "lg";
};

/** Three polaroid-style artifact photographs fanned out in a retro stack.
 * Springs in on mount; each card lifts/rotates on hover.
 * Uses our museum palette: cream matting, ink captions, brass hairline edge. */
export function ArtifactStack({
  leftImage,
  middleImage,
  rightImage,
  leftCaption,
  middleCaption,
  rightCaption,
  size = "md",
}: Props) {
  const dims = {
    sm: { box: "w-56 h-56", card: "w-40 h-48" },
    md: { box: "w-80 h-72", card: "w-52 h-64" },
    lg: { box: "w-[28rem] h-80", card: "w-64 h-80" },
  }[size];

  const container: Variants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { delay: 0.15, staggerChildren: 0.18 },
    },
  };

  const left: Variants = {
    initial: { rotate: 0, x: 0, y: 0, opacity: 0 },
    animate: {
      rotate: -9, x: -110, y: 12, opacity: 1,
      transition: { type: "spring", stiffness: 120, damping: 13 },
    },
    hover: {
      rotate: -3, x: -130, y: -4,
      transition: { type: "spring", stiffness: 220, damping: 16 },
    },
  };

  const middle: Variants = {
    initial: { rotate: 0, x: 0, y: 0, opacity: 0 },
    animate: {
      rotate: 5, x: 0, y: -6, opacity: 1,
      transition: { type: "spring", stiffness: 120, damping: 13 },
    },
    hover: {
      rotate: 0, x: 0, y: -18,
      transition: { type: "spring", stiffness: 220, damping: 16 },
    },
  };

  const right: Variants = {
    initial: { rotate: 0, x: 0, y: 0, opacity: 0 },
    animate: {
      rotate: 7, x: 110, y: 18, opacity: 1,
      transition: { type: "spring", stiffness: 120, damping: 13 },
    },
    hover: {
      rotate: 2, x: 130, y: 4,
      transition: { type: "spring", stiffness: 220, damping: 16 },
    },
  };

  return (
    <motion.div
      className={`artifact-stack relative flex items-center justify-center ${dims.box}`}
      variants={container}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: "0px 0px -15% 0px" }}
    >
      <motion.figure
        className={`polaroid ${dims.card}`}
        variants={left}
        whileHover="hover"
        style={{ zIndex: 10, originY: 1, originX: 1 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={leftImage} alt={leftCaption || ""} />
        {leftCaption && <figcaption>{leftCaption}</figcaption>}
      </motion.figure>

      <motion.figure
        className={`polaroid ${dims.card}`}
        variants={middle}
        whileHover="hover"
        style={{ zIndex: 30, originY: 1 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={middleImage} alt={middleCaption || ""} />
        {middleCaption && <figcaption>{middleCaption}</figcaption>}
      </motion.figure>

      <motion.figure
        className={`polaroid ${dims.card}`}
        variants={right}
        whileHover="hover"
        style={{ zIndex: 20, originY: 1, originX: 0 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={rightImage} alt={rightCaption || ""} />
        {rightCaption && <figcaption>{rightCaption}</figcaption>}
      </motion.figure>
    </motion.div>
  );
}
