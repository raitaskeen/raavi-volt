import Link from "next/link";
import { ArrowRight, BatteryCharging, Flame, QrCode, ShieldCheck, Truck, Zap } from "lucide-react";
import { WhatsAppIcon } from "@/components/site/icons";
import { Button } from "@/components/ui/button";
import { Reveal, RevealItem, Stagger } from "@/components/motion";
import { ProductGrid } from "@/components/site/product-card";
import { CategoryIcon } from "@/components/site/category-icon";
import { BrandMarquee } from "@/components/site/brand-marquee";
import { DealCard } from "@/components/site/deal-card";
import { categories, shipping, store } from "@/config/store";
import { listDeals, listProducts } from "@/lib/products";
import { formatPKR } from "@/lib/utils";

export const dynamic = "force-dynamic";

const perks = [
  { icon: ShieldCheck, title: `Authorised ${store.authorisedDealerOf} dealer`, body: "100% genuine stock with official brand warranty." },
  { icon: Truck, title: "Fast Lahore delivery", body: `${shipping.lahoreEta}. Free over ${formatPKR(shipping.freeOver)}.` },
  { icon: QrCode, title: "Pay in seconds", body: "Scan our Raast QR from any bank app. No card needed." },
  { icon: WhatsAppIcon, title: "Real humans", body: "Order help and after-sales on WhatsApp." },
];

const budgets = [
  { label: "Under", value: "Rs 5,000", href: "/shop?max=5000" },
  { label: "Under", value: "Rs 10,000", href: "/shop?max=10000" },
  { label: "Under", value: "Rs 20,000", href: "/shop?max=20000" },
  { label: "Premium", value: "Rs 20,000+", href: "/shop?min=20000" },
];

function SectionHead({ eyebrow, title, href, linkLabel = "View all" }: { eyebrow: string; title: React.ReactNode; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
      <div>
        <p className="eyebrow mb-2 text-muted-foreground">{eyebrow}</p>
        <h2 className="text-2xl sm:text-4xl">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="group flex shrink-0 items-center gap-1 text-sm font-medium">
          {linkLabel} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

export default async function HomePage() {
  const [deals, featured, latest] = await Promise.all([
    listDeals(5),
    listProducts({ featured: true, pageSize: 8 }),
    listProducts({ sort: "newest", pageSize: 8 }),
  ]);
  const [dealOfDay, ...moreDeals] = deals;

  return (
    <>
      {/* Hero — CSS entrance animations so content paints before JS loads */}
      <section className="grid-dark relative overflow-hidden bg-matte text-white">
        <div className="pointer-events-none absolute -top-40 -right-40 size-[520px] rounded-full bg-volt/10 blur-3xl" aria-hidden />
        <div className="container-x relative grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:py-24">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
            <p className="eyebrow mb-6 flex items-center gap-2 text-white/60">
              <span className="size-2 animate-pulse-dot rounded-full bg-volt" aria-hidden />
              Lahore · Delivering today
            </p>
            <h1 className="text-[clamp(2.7rem,7.5vw,5.6rem)] leading-[0.92]">
              Everything{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-ink">electric.</span>
                <span className="absolute inset-x-[-0.08em] inset-y-[0.08em] -rotate-1 rounded-md bg-volt" aria-hidden />
              </span>
              <br />
              <span className="text-white/40">One store.</span>
            </h1>
            <p className="mt-7 max-w-md text-base text-white/65 sm:text-lg">
              Geepas and trusted brands for your kitchen, home and load-shedding nights — delivered across Lahore, paid by QR in seconds.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="xl" variant="volt">
                <Link href="/shop">
                  Shop all products <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline-inverse">
                <Link href="/shop?sale=1">
                  <Flame className="text-flame" /> Today&apos;s deals
                </Link>
              </Button>
            </div>
            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-white/10 pt-6">
              {[
                ["7", "Categories"],
                ["24h", "Lahore delivery"],
                ["1yr", "Brand warranty"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="sr-only">{l}</dt>
                  <dd className="font-display text-3xl">{v}</dd>
                  <dd className="mt-1 font-mono text-[10px] tracking-wider text-white/50 uppercase">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          {dealOfDay ? (
            <DealCard product={dealOfDay} />
          ) : (
            <div className="grid aspect-square place-items-center rounded-2xl border border-white/10">
              <Zap className="size-24 text-volt" strokeWidth={1} />
            </div>
          )}
        </div>
      </section>

      <BrandMarquee />

      {/* Categories */}
      <section className="container-x py-14 sm:py-20">
        <SectionHead eyebrow="Browse" title="Shop by category" href="/shop" linkLabel="All products" />
        <Stagger className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-7">
          {categories.map((c) => (
            <RevealItem key={c.slug} className="w-36 shrink-0 snap-start sm:w-auto">
              <Link
                href={`/shop?category=${c.slug}`}
                className="group flex h-full flex-col gap-8 rounded-xl border bg-card p-4 transition-all duration-300 hover:-translate-y-1 hover:border-ink hover:bg-ink hover:text-white hover:shadow-[0_16px_40px_-16px_rgb(0_0_0/0.5)]"
              >
                <span className="grid size-12 place-items-center rounded-lg bg-paper transition-colors group-hover:bg-volt group-hover:text-ink">
                  <CategoryIcon category={c.slug} className="size-6" strokeWidth={1.5} />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{c.name}</span>
                  <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground group-hover:text-white/60">{c.blurb}</span>
                </span>
              </Link>
            </RevealItem>
          ))}
        </Stagger>
      </section>

      {/* Deals rail */}
      {moreDeals.length > 0 && (
        <section className="bg-flame/[0.06] py-14 sm:py-20">
          <div className="container-x">
            <SectionHead
              eyebrow="Limited-time prices"
              title={
                <span className="flex items-center gap-3">
                  <Flame className="size-8 fill-flame text-flame" /> Hot deals
                </span>
              }
              href="/shop?sale=1"
              linkLabel="All deals"
            />
            <ProductGrid products={moreDeals.slice(0, 4)} />
          </div>
        </section>
      )}

      {/* Featured */}
      {featured.items.length > 0 && (
        <section className="container-x pt-14 sm:pt-20">
          <SectionHead eyebrow="Customer favourites" title="Best sellers" href="/shop" />
          <ProductGrid products={featured.items} />
        </section>
      )}

      {/* Shop by budget */}
      <section className="container-x py-14 sm:py-20">
        <SectionHead eyebrow="Find the right fit" title="Shop by budget" />
        <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {budgets.map((b, i) => (
            <RevealItem key={b.href}>
              <Link
                href={b.href}
                className={`group flex h-full flex-col justify-between gap-10 rounded-xl p-5 transition-transform duration-300 hover:-translate-y-1 sm:p-6 ${
                  i === 3 ? "bg-volt text-ink" : "bg-matte text-white"
                }`}
              >
                <span className="eyebrow opacity-60">{b.label}</span>
                <span className="flex items-end justify-between gap-2">
                  <span className="font-display text-2xl sm:text-3xl">{b.value}</span>
                  <ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </RevealItem>
          ))}
        </Stagger>
      </section>

      {/* Promo */}
      <section className="container-x">
        <Reveal className="grid overflow-hidden rounded-2xl bg-ink text-white md:grid-cols-2">
          <div className="grid content-center gap-5 p-8 sm:p-12">
            <span className="grid size-12 place-items-center rounded-xl bg-volt text-ink">
              <BatteryCharging className="size-6" strokeWidth={1.75} />
            </span>
            <h2 className="text-3xl leading-tight sm:text-5xl">Built for Lahore&apos;s load-shedding.</h2>
            <p className="max-w-sm text-white/60">Rechargeable fans, lanterns and emergency lights that keep going when the grid doesn&apos;t.</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" variant="volt">
                <Link href="/shop?category=cooling-heating">Rechargeable fans</Link>
              </Button>
              <Button asChild size="lg" variant="outline-inverse">
                <Link href="/shop?category=lighting">Lights & lanterns</Link>
              </Button>
            </div>
          </div>
          <div className="grid-dark relative grid min-h-72 place-items-center">
            <div className="absolute size-64 rounded-full bg-volt/15 blur-3xl" aria-hidden />
            <div className="relative grid grid-cols-2 gap-4 p-8">
              {["cooling-heating", "lighting"].map((c, i) => (
                <div
                  key={c}
                  className={`grid aspect-square w-28 place-items-center rounded-2xl border border-white/10 sm:w-36 ${i === 1 ? "translate-y-6 bg-volt text-ink" : "bg-white/5"}`}
                >
                  <CategoryIcon category={c} className="size-14 sm:size-16" />
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* New arrivals */}
      {latest.items.length > 0 && (
        <section className="container-x pt-14 sm:pt-20">
          <SectionHead eyebrow="Just landed" title="New arrivals" href="/shop?sort=newest" />
          <ProductGrid products={latest.items} />
        </section>
      )}

      {/* Perks + how to pay */}
      <section className="container-x pt-14 sm:pt-20">
        <Stagger className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {perks.map(({ icon: Icon, title, body }) => (
            <RevealItem key={title} className="bg-card p-6">
              <span className="grid size-10 place-items-center rounded-lg bg-paper">
                <Icon className="size-5" strokeWidth={1.5} />
              </span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </RevealItem>
          ))}
        </Stagger>

        <Reveal className="mt-14 overflow-hidden rounded-2xl bg-matte text-white sm:mt-20">
          <div className="grid gap-8 p-8 sm:p-12 lg:grid-cols-[1fr_1.4fr] lg:items-center">
            <div>
              <p className="eyebrow text-volt">How paying works</p>
              <h2 className="mt-3 text-3xl sm:text-4xl">Order in a minute. Pay from your bank app.</h2>
            </div>
            <ol className="grid gap-4 sm:grid-cols-3">
              {[
                ["01", "Place your order", "Add to cart and enter your address — no account needed."],
                ["02", "Scan & pay", "Scan our QR or transfer to bank / JazzCash / Easypaisa."],
                ["03", "Share the receipt", `Submit your transaction ID. ${store.name} confirms and dispatches.`],
              ].map(([n, t, b]) => (
                <li key={n} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                  <span className="font-display text-2xl text-volt">{n}</span>
                  <h3 className="mt-3 font-semibold">{t}</h3>
                  <p className="mt-1 text-sm text-white/60">{b}</p>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </section>
    </>
  );
}
