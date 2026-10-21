import Link from "next/link";
import { Truck } from "lucide-react";
import { ProductImage } from "@/components/site/product-image";
import { QuickAdd } from "@/components/site/add-to-cart";
import { shipping } from "@/config/store";
import type { ProductSummary } from "@/lib/products";
import { discountPercent, formatPKR } from "@/lib/utils";

export function ProductCard({ product, priority }: { product: ProductSummary; priority?: boolean }) {
  const off = discountPercent(product.price, product.compareAt);
  const soldOut = product.stock <= 0;
  const lowStock = !soldOut && product.stock <= 5;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-[box-shadow,border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-[0_18px_40px_-18px_rgb(0_0_0/0.35)]">
      <Link href={`/product/${product.slug}`} className="flex flex-1 flex-col">
        <div className="relative">
          <ProductImage src={product.images[0]} alt={product.name} category={product.category} brand={product.brand} priority={priority} />
          {product.images[1] && (
            <ProductImage
              src={product.images[1]}
              alt=""
              category={product.category}
              className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}
          <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1">
            {soldOut ? (
              <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold text-white">Sold out</span>
            ) : off > 0 ? (
              <span className="rounded-full bg-flame px-2 py-0.5 font-mono text-[10px] font-semibold text-white">−{off}%</span>
            ) : null}
            {product.featured && !soldOut && <span className="rounded-full bg-volt px-2 py-0.5 text-[10px] font-semibold text-ink">Best seller</span>}
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-1.5 border-t p-3 sm:p-4">
          <p className="eyebrow text-muted-foreground">{product.brand}</p>
          <h3 className="line-clamp-2 text-[13px] leading-snug font-medium sm:text-sm">{product.name}</h3>
          <div className="mt-auto grid gap-1 pt-1 pr-9">
            <div className="flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-[15px] font-semibold tabular-nums">{formatPKR(product.price)}</span>
              {off > 0 && <s className="text-[11px] text-muted-foreground tabular-nums">{formatPKR(product.compareAt!)}</s>}
            </div>
            {lowStock ? (
              <span className="text-[11px] font-semibold text-flame">Only {product.stock} left</span>
            ) : product.price >= shipping.freeOver ? (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Truck className="size-3" /> Free delivery
              </span>
            ) : null}
          </div>
        </div>
      </Link>
      <QuickAdd product={product} className="absolute right-3 bottom-3 sm:right-4 sm:bottom-4" />
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: ProductSummary[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}
