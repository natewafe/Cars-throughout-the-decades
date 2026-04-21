import Link from "next/link";
import { cars } from "@/lib/cars";

export function SiteHeader() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-sm bg-[color:var(--color-paper)]/70 border-b border-[color:var(--color-rule)]">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="serif-display text-xl tracking-[-0.02em] leading-none"
        >
          The Motor Gallery
        </Link>

        <nav className="hidden md:flex items-center gap-10 text-[0.8125rem] font-medium">
          {cars.map((car) => (
            <Link
              key={car.slug}
              href={`/${car.slug}`}
              className="text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)] transition-colors uppercase tracking-[0.18em] text-[0.6875rem]"
            >
              {car.maker}
            </Link>
          ))}
          <Link
            href="/about"
            className="text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)] transition-colors uppercase tracking-[0.18em] text-[0.6875rem]"
          >
            About
          </Link>
        </nav>

        <div className="eyebrow hidden md:block">Est. 2026</div>
      </div>
    </header>
  );
}
