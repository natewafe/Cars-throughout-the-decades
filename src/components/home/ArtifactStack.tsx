"use client";

import { useState } from "react";

type Props = {
  leftImage: string;
  middleImage: string;
  rightImage: string;
  leftCaption?: string;
  middleCaption?: string;
  rightCaption?: string;
  size?: "sm" | "md" | "lg";
  /** click = standalone, toggle on click. hover = parent-hover-driven (no click capture). */
  mode?: "click" | "hover";
};

/** Three polaroid artifacts stacked with visible peek-out edges so the collapsed
 * state clearly reads as "multiple images." Transforms are pure CSS — no
 * per-child hover variants (which glitched when the cursor crossed siblings). */
export function ArtifactStack({
  leftImage,
  middleImage,
  rightImage,
  leftCaption,
  middleCaption,
  rightCaption,
  size = "md",
  mode = "click",
}: Props) {
  const [open, setOpen] = useState(false);

  const toggle = (e: React.SyntheticEvent) => {
    if (mode !== "click") return;
    e.preventDefault();
    e.stopPropagation();
    setOpen((v) => !v);
  };

  const dims = {
    sm: { box: "w-64 h-64", card: "w-44 h-52" },
    md: { box: "w-80 h-80", card: "w-52 h-64" },
    lg: { box: "w-[30rem] h-[22rem]", card: "w-64 h-80" },
  }[size];

  return (
    <div
      className={`artifact-stack stack-${size} mode-${mode}${open ? " is-open" : ""} relative flex items-center justify-center ${dims.box}`}
      onClick={toggle}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && mode === "click") toggle(e);
      }}
      role={mode === "click" ? "button" : undefined}
      tabIndex={mode === "click" ? 0 : -1}
      aria-expanded={mode === "click" ? open : undefined}
      aria-label={mode === "click" ? (open ? "Collapse artifact stack" : "Expand artifact stack — 3 images") : undefined}
    >
      <figure className={`polaroid polaroid-left ${dims.card}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={leftImage} alt={leftCaption || ""} loading="lazy" decoding="async" />
        {leftCaption && <figcaption>{leftCaption}</figcaption>}
      </figure>

      <figure className={`polaroid polaroid-right ${dims.card}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={rightImage} alt={rightCaption || ""} loading="lazy" decoding="async" />
        {rightCaption && <figcaption>{rightCaption}</figcaption>}
      </figure>

      <figure className={`polaroid polaroid-middle ${dims.card}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={middleImage} alt={middleCaption || ""} loading="lazy" decoding="async" />
        {middleCaption && <figcaption>{middleCaption}</figcaption>}
      </figure>

      {mode === "click" && (
        <span className="stack-hint" aria-hidden="true">
          {open ? "Click to collapse" : "3 images — click to expand"}
        </span>
      )}
    </div>
  );
}
