"use client";

/** Edge-to-edge scrolling marquee — signature motion band between sections. */
export function Marquee({ items }: { items: string[] }) {
  // Duplicate the list so the CSS animation loops seamlessly.
  const loop = [...items, ...items];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {loop.map((t, i) => (
          <span key={i} className="marquee-item">
            {t}
            <span className="marquee-sep" aria-hidden="true">
              ◆
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
