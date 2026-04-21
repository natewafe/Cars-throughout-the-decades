import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-32 border-t border-[color:var(--color-rule)]">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12 py-16 grid gap-12 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="serif-display text-3xl leading-[0.95]">The Motor Gallery</div>
          <p className="mt-4 max-w-md text-[color:var(--color-ink-muted)] text-[0.9375rem] leading-relaxed">
            A small curation of the automobiles that rewrote their decades — told in
            photographs, engineering notes, and quiet reverence.
          </p>
        </div>

        <div className="text-[0.8125rem]">
          <div className="eyebrow mb-4">Exhibits</div>
          <ul className="space-y-2">
            <li><Link href="/countach" className="hover:text-[color:var(--color-brass-dark)]">Lamborghini Countach</Link></li>
            <li><Link href="/959" className="hover:text-[color:var(--color-brass-dark)]">Porsche 959</Link></li>
            <li><Link href="/f1" className="hover:text-[color:var(--color-brass-dark)]">McLaren F1</Link></li>
            <li><Link href="/veyron" className="hover:text-[color:var(--color-brass-dark)]">Bugatti Veyron</Link></li>
          </ul>
        </div>

        <div className="text-[0.8125rem]">
          <div className="eyebrow mb-4">Gallery</div>
          <ul className="space-y-2">
            <li><Link href="/about" className="hover:text-[color:var(--color-brass-dark)]">About the curation</Link></li>
            <li><span className="text-[color:var(--color-ink-soft)]">Visit · by appointment</span></li>
            <li><span className="text-[color:var(--color-ink-soft)]">Press · inquire</span></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[color:var(--color-rule)]">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12 py-6 flex flex-wrap items-center justify-between gap-4 text-[0.75rem] text-[color:var(--color-ink-soft)]">
          <span>© {new Date().getFullYear()} The Motor Gallery</span>
          <span className="eyebrow">Cars Throughout The Decades</span>
        </div>
      </div>
    </footer>
  );
}
