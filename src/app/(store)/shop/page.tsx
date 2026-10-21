import type { Metadata } from "next";
import Link from "next/link";
import Form from "next/form";
import { Suspense } from "react";
import { Check, Flame, PackageCheck, SearchX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/site/product-card";
import { SortSelect } from "@/components/site/sort-select";
import { FilterSheet } from "@/components/site/filter-sheet";
import { CategoryIcon } from "@/components/site/category-icon";
import { categories, getCategory } from "@/config/store";
import { listProducts, shopFacets } from "@/lib/products";
import { cn, formatPKR } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;
type Params = Record<string, string>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const int = (v: string) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

const priceRanges = [
  { label: "Under Rs 5,000", min: "", max: "5000" },
  { label: "Rs 5,000 – 10,000", min: "5000", max: "10000" },
  { label: "Rs 10,000 – 20,000", min: "10000", max: "20000" },
  { label: "Rs 20,000 +", min: "20000", max: "" },
];

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const cat = getCategory(one(sp.category));
  const q = one(sp.q);
  return {
    title: q ? `Search: ${q}` : one(sp.sale) ? "Deals & discounts" : cat ? cat.long : "Shop all electric appliances",
    description: cat ? `${cat.long} in Lahore — ${cat.blurb}.` : "Shop Geepas and top-brand electric appliances in Lahore.",
    alternates: { canonical: cat ? `/shop?category=${cat.slug}` : "/shop" },
  };
}

function hrefWith(current: Params, patch: Record<string, string | null>) {
  const params = new URLSearchParams(current);
  params.delete("page");
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === "") params.delete(k);
    else params.set(k, v);
  }
  const s = params.toString();
  return s ? `/shop?${s}` : "/shop";
}

function FilterLink({ href, active, children, count }: { href: string; active: boolean; children: React.ReactNode; count?: number }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
        active ? "bg-ink font-medium text-white" : "text-charcoal hover:bg-accent hover:text-ink",
      )}
    >
      <span className={cn("grid size-4 shrink-0 place-items-center rounded border", active ? "border-volt bg-volt text-ink" : "border-input bg-card")}>
        {active && <Check className="size-3" strokeWidth={3} />}
      </span>
      <span className="flex-1">{children}</span>
      {count !== undefined && <span className={cn("font-mono text-[11px]", active ? "text-white/60" : "text-muted-foreground")}>{count}</span>}
    </Link>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b pb-5 last:border-0">
      <h3 className="eyebrow mb-2 px-2.5 text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

export default async function ShopPage({ searchParams }: { searchParams: SP }) {
  const raw = await searchParams;
  const sp: Params = {
    category: one(raw.category),
    brand: one(raw.brand).slice(0, 40),
    q: one(raw.q).slice(0, 80),
    sort: one(raw.sort),
    page: one(raw.page),
    min: one(raw.min),
    max: one(raw.max),
    sale: one(raw.sale) === "1" ? "1" : "",
    stock: one(raw.stock) === "1" ? "1" : "",
  };
  const category = getCategory(sp.category);
  const page = int(sp.page) ?? 1;
  const [result, facets] = await Promise.all([
    listProducts({
      category: category?.slug,
      brand: sp.brand || undefined,
      q: sp.q,
      sort: sp.sort,
      page,
      pageSize: 24,
      minPrice: int(sp.min),
      maxPrice: int(sp.max),
      onSale: sp.sale === "1",
      inStock: sp.stock === "1",
    }),
    shopFacets(),
  ]);
  const current = Object.fromEntries(Object.entries(sp).filter(([, v]) => v)) as Params;

  const chips: { label: string; href: string }[] = [
    ...(sp.q ? [{ label: `“${sp.q}”`, href: hrefWith(current, { q: null }) }] : []),
    ...(category ? [{ label: category.name, href: hrefWith(current, { category: null }) }] : []),
    ...(sp.brand ? [{ label: sp.brand, href: hrefWith(current, { brand: null }) }] : []),
    ...(sp.min || sp.max
      ? [{ label: `${sp.min ? formatPKR(+sp.min) : "Rs 0"} – ${sp.max ? formatPKR(+sp.max) : "any"}`, href: hrefWith(current, { min: null, max: null }) }]
      : []),
    ...(sp.sale ? [{ label: "On sale", href: hrefWith(current, { sale: null }) }] : []),
    ...(sp.stock ? [{ label: "In stock", href: hrefWith(current, { stock: null }) }] : []),
  ];

  const filters = (
    <div className="grid gap-5">
      <FilterGroup title="Quick filters">
        <FilterLink href={hrefWith(current, { sale: sp.sale ? null : "1" })} active={!!sp.sale} count={facets.onSale}>
          <span className="flex items-center gap-1.5">
            <Flame className="size-3.5 text-flame" /> On sale
          </span>
        </FilterLink>
        <FilterLink href={hrefWith(current, { stock: sp.stock ? null : "1" })} active={!!sp.stock}>
          <span className="flex items-center gap-1.5">
            <PackageCheck className="size-3.5" /> In stock only
          </span>
        </FilterLink>
      </FilterGroup>
      <FilterGroup title="Category">
        <FilterLink href={hrefWith(current, { category: null })} active={!category} count={facets.total}>
          All categories
        </FilterLink>
        {categories.map((c) => (
          <FilterLink key={c.slug} href={hrefWith(current, { category: c.slug })} active={category?.slug === c.slug} count={facets.categories[c.slug] ?? 0}>
            {c.long}
          </FilterLink>
        ))}
      </FilterGroup>
      <FilterGroup title="Brand">
        {facets.brands.map((b) => (
          <FilterLink key={b.k} href={hrefWith(current, { brand: sp.brand === b.k ? null : b.k })} active={sp.brand === b.k} count={b.n}>
            {b.k}
          </FilterLink>
        ))}
      </FilterGroup>
      <FilterGroup title="Price">
        {priceRanges.map((r) => {
          const active = sp.min === r.min && sp.max === r.max;
          return (
            <FilterLink key={r.label} href={hrefWith(current, active ? { min: null, max: null } : { min: r.min || null, max: r.max || null })} active={active}>
              {r.label}
            </FilterLink>
          );
        })}
        <Form action="/shop" scroll={false} className="mt-2 grid grid-cols-[1fr_1fr_auto] items-center gap-2 px-1">
          {Object.entries(current)
            .filter(([k]) => !["min", "max", "page"].includes(k))
            .map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
          <label className="sr-only" htmlFor="min">
            Minimum price
          </label>
          <input id="min" name="min" type="number" inputMode="numeric" min={0} placeholder="Min" defaultValue={sp.min} className="h-9 w-full rounded-md border border-input bg-card px-2.5 text-sm outline-none focus-visible:border-charcoal" />
          <label className="sr-only" htmlFor="max">
            Maximum price
          </label>
          <input id="max" name="max" type="number" inputMode="numeric" min={0} placeholder="Max" defaultValue={sp.max} className="h-9 w-full rounded-md border border-input bg-card px-2.5 text-sm outline-none focus-visible:border-charcoal" />
          <Button type="submit" size="sm" variant="outline" className="h-9">
            Go
          </Button>
        </Form>
      </FilterGroup>
    </div>
  );

  const heading = sp.q ? `Results for “${sp.q}”` : sp.sale && !category ? "Hot deals" : category ? category.long : "All products";

  return (
    <>
      {/* Banner */}
      <section className="grid-dark relative overflow-hidden bg-matte text-white">
        <div className="pointer-events-none absolute -right-24 -bottom-32 size-96 rounded-full bg-volt/10 blur-3xl" aria-hidden />
        <div className="container-x relative flex items-end justify-between gap-6 py-10 sm:py-14">
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
            <nav aria-label="Breadcrumb" className="eyebrow mb-4 text-white/50">
              <Link href="/" className="hover:text-white">
                Home
              </Link>{" "}
              / <span className="text-white">{category ? category.name : "Shop"}</span>
            </nav>
            <h1 className="text-4xl sm:text-6xl">{heading}</h1>
            <p className="mt-3 text-sm text-white/60">
              {result.total} {result.total === 1 ? "product" : "products"}
              {category && !sp.q ? ` · ${category.blurb}` : ""}
            </p>
          </div>
          {category ? (
            <span className="hidden size-24 shrink-0 place-items-center rounded-2xl bg-volt text-ink sm:grid">
              <CategoryIcon category={category.slug} className="size-12" strokeWidth={1.5} />
            </span>
          ) : sp.sale ? (
            <span className="hidden size-24 shrink-0 place-items-center rounded-2xl bg-flame sm:grid">
              <Flame className="size-12 fill-white text-white" />
            </span>
          ) : null}
        </div>
      </section>

      <div className="container-x grid gap-8 py-8 lg:grid-cols-[240px_1fr] lg:py-10">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="no-scrollbar sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pr-2">{filters}</div>
        </aside>

        <div className="min-w-0">
          <div className="sticky top-16 z-30 -mx-4 mb-5 flex items-center gap-2 border-b bg-paper/90 px-4 py-3 backdrop-blur-md sm:mx-0 sm:rounded-xl sm:border sm:px-3">
            <Suspense>
              <FilterSheet count={result.total} active={chips.length}>
                {filters}
              </FilterSheet>
            </Suspense>
            <nav aria-label="Categories" className="no-scrollbar flex flex-1 gap-2 overflow-x-auto lg:hidden">
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={hrefWith(current, { category: category?.slug === c.slug ? null : c.slug })}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium",
                    category?.slug === c.slug ? "border-ink bg-ink text-white" : "bg-card",
                  )}
                >
                  {c.name}
                </Link>
              ))}
            </nav>
            <p className="hidden flex-1 text-sm text-muted-foreground lg:block">
              Showing <span className="font-medium text-ink">{result.items.length}</span> of {result.total}
            </p>
            <Suspense>
              <SortSelect value={sp.sort || "featured"} />
            </Suspense>
          </div>

          {chips.length > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {chips.map((c) => (
                <Link key={c.label} href={c.href} scroll={false} className="flex items-center gap-1.5 rounded-full bg-volt py-1 pr-2 pl-3 text-xs font-medium text-ink hover:bg-volt-deep">
                  {c.label} <X className="size-3.5" />
                </Link>
              ))}
              <Link href="/shop" className="px-2 text-xs font-medium underline-offset-4 hover:underline">
                Clear all
              </Link>
            </div>
          )}

          {result.items.length === 0 ? (
            <div className="grid place-items-center gap-4 rounded-xl border border-dashed bg-card py-20 text-center">
              <SearchX className="size-10 text-muted-foreground" strokeWidth={1.25} />
              <div>
                <p className="font-medium">No products match these filters</p>
                <p className="mt-1 text-sm text-muted-foreground">Try removing a filter or searching for something else.</p>
              </div>
              <Button asChild variant="outline">
                <Link href="/shop">Clear filters</Link>
              </Button>
            </div>
          ) : (
            <div className="[&>div]:md:grid-cols-3 [&>div]:xl:grid-cols-3 [&>div]:2xl:grid-cols-4">
              <ProductGrid products={result.items} priorityCount={4} />
            </div>
          )}

          {result.pageCount > 1 && (
            <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
              {Array.from({ length: result.pageCount }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`${hrefWith(current, {})}${p > 1 ? `${Object.keys(current).filter((k) => k !== "page").length ? "&" : "?"}page=${p}` : ""}`}
                  aria-current={p === page ? "page" : undefined}
                  className={cn("grid size-10 place-items-center rounded-md border font-mono text-sm", p === page ? "border-ink bg-ink text-white" : "bg-card hover:border-charcoal/40")}
                >
                  {p}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </>
  );
}
