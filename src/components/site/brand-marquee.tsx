import { brands } from "@/config/store";

const names = brands.filter((b) => b !== "Other");

/** Pure-CSS infinite marquee (no JS). Content is duplicated for a seamless loop. */
export function BrandMarquee() {
  const row = [...names, ...names];
  return (
    <div className="relative overflow-hidden border-y bg-card py-5" aria-label={`Brands we stock: ${names.join(", ")}`}>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-card to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-card to-transparent" />
      <div className="flex w-max animate-marquee items-center gap-14 pr-14" aria-hidden>
        {[...row, ...row].map((b, i) => (
          <span key={i} className="font-display text-xl tracking-tight whitespace-nowrap text-charcoal/80 sm:text-2xl">
            {b}
            <span className="ml-14 text-muted-foreground/40">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
