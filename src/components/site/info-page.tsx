
/** Shared layout for static content pages (about, policies). */
export function InfoPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <div className="container-x max-w-3xl py-12 sm:py-20">
      <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
        <p className="eyebrow text-muted-foreground">{eyebrow}</p>
        <h1 className="mt-3 text-4xl sm:text-5xl">{title}</h1>
        {intro && <p className="mt-4 text-lg text-muted-foreground">{intro}</p>}
      </div>
      <div className="mt-10 grid gap-8 border-t pt-10 text-[15px] leading-relaxed text-charcoal [&_h2]:text-xl [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_section]:grid [&_section]:gap-3 [&_ul]:grid [&_ul]:gap-1.5">
        {children}
      </div>
    </div>
  );
}
