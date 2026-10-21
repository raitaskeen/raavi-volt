import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { BadgeCheck, QrCode, Truck } from "lucide-react";
import { WhatsAppIcon } from "@/components/site/icons";
import { ProductGallery } from "@/components/site/product-gallery";
import { AddToCart } from "@/components/site/add-to-cart";
import { Price } from "@/components/site/price";
import { ProductGrid } from "@/components/site/product-card";
import { getCategory, shipping, store } from "@/config/store";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import { formatPKR, mediaUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

// Dedupe the D1 read between generateMetadata and the page.
const getProduct = cache((slug: string) => getProductBySlug(slug));

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return { title: "Product not found" };
  const image = product.images[0] ? mediaUrl(product.images[0]) : undefined;
  return {
    title: product.name,
    description: product.shortDesc || product.description.slice(0, 155),
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: { title: product.name, description: product.shortDesc, images: image ? [image] : undefined },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product, 4);
  const category = getCategory(product.category);
  // Delivery promise for Lahore: order before 5pm PKT → tomorrow, otherwise the day after.
  const pktNow = new Date(Date.now() + 5 * 3600 * 1000);
  const eta = new Date(pktNow.getTime() + (pktNow.getUTCHours() < 17 ? 1 : 2) * 86400 * 1000);
  const etaLabel = new Intl.DateTimeFormat("en-PK", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(eta);
  const stockLabel =
    product.stock <= 0 ? "Sold out" : product.stock <= 5 ? `Only ${product.stock} left` : "In stock — ready to ship";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    brand: { "@type": "Brand", name: product.brand },
    sku: product.sku ?? undefined,
    description: product.shortDesc || product.description,
    image: product.images.map((i) => `${store.url}${mediaUrl(i)}`),
    offers: {
      "@type": "Offer",
      priceCurrency: "PKR",
      price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${store.url}/product/${product.slug}`,
    },
  };

  return (
    <div className="container-x py-6 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Breadcrumb" className="eyebrow mb-6 truncate text-muted-foreground">
        <Link href="/" className="hover:text-ink">
          Home
        </Link>{" "}
        /{" "}
        <Link href={`/shop?category=${product.category}`} className="hover:text-ink">
          {category?.name ?? "Shop"}
        </Link>{" "}
        / <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={product.images} name={product.name} category={product.category} brand={product.brand} />

        <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
          <div className="grid gap-3">
            <p className="eyebrow text-muted-foreground">
              {product.brand}
              {product.sku && <span className="ml-3 text-muted-foreground/70">SKU {product.sku}</span>}
            </p>
            <h1 className="text-2xl leading-tight font-semibold tracking-tight sm:text-4xl">{product.name}</h1>
            {product.shortDesc && <p className="text-muted-foreground">{product.shortDesc}</p>}
          </div>

          <div className="grid gap-2">
            <Price price={product.price} compareAt={product.compareAt} size="lg" />
            <p className={`flex items-center gap-2 text-sm ${product.stock > 0 && product.stock <= 5 ? "font-semibold text-flame" : ""}`}>
              <span
                className={`size-2 rounded-full ${product.stock <= 0 ? "bg-muted-foreground/40" : product.stock <= 5 ? "animate-pulse-dot bg-flame" : "bg-volt-deep"}`}
                aria-hidden
              />
              {stockLabel}
            </p>
            {product.stock > 0 && (
              <p className="flex items-center gap-2 rounded-lg bg-volt/25 px-3 py-2 text-sm">
                <Truck className="size-4 shrink-0" />
                <span>
                  Get it in Lahore by <strong>{etaLabel}</strong> — order before 5pm.
                </span>
              </p>
            )}
          </div>

          <AddToCart
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              brand: product.brand,
              price: product.price,
              images: product.images.slice(0, 1),
              category: product.category,
              stock: product.stock,
            }}
          />

          <ul className="grid gap-px overflow-hidden rounded-lg border bg-border text-sm sm:grid-cols-2">
            {[
              { icon: Truck, text: product.price >= shipping.freeOver ? "Free delivery" : `${shipping.lahoreEta}` },
              { icon: BadgeCheck, text: product.warranty ?? "Genuine product" },
              { icon: QrCode, text: "Pay by bank transfer / QR" },
              { icon: WhatsAppIcon, text: "WhatsApp support" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 bg-card px-4 py-3">
                <Icon className="size-4 shrink-0" strokeWidth={1.5} />
                {text}
              </li>
            ))}
          </ul>

          {product.description && (
            <section className="grid gap-3 border-t pt-6">
              <h2 className="eyebrow text-muted-foreground">Overview</h2>
              <p className="leading-relaxed whitespace-pre-line text-charcoal">{product.description}</p>
            </section>
          )}

          {product.specs.length > 0 && (
            <section className="grid gap-3 border-t pt-6">
              <h2 className="eyebrow text-muted-foreground">Specifications</h2>
              <dl className="divide-y rounded-lg border bg-card text-sm">
                {product.specs.map((s) => (
                  <div key={s.label} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 px-4 py-3">
                    <dt className="text-muted-foreground">{s.label}</dt>
                    <dd className="font-medium">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <p className="text-xs text-muted-foreground">
            Delivery: {shipping.lahoreEta} ({formatPKR(shipping.lahoreFee)}), {shipping.nationwideEta} (
            {formatPKR(shipping.nationwideFee)}). Free over {formatPKR(shipping.freeOver)}.
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight">You may also like</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
