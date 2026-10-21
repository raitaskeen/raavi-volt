import Link from "next/link";
import { Flame } from "lucide-react";
import { Countdown } from "@/components/site/countdown";
import { ProductImage } from "@/components/site/product-image";
import { QuickAddButton } from "@/components/site/add-to-cart";
import type { ProductSummary } from "@/lib/products";
import { discountPercent, formatPKR } from "@/lib/utils";

/** Hero "Deal of the day" — the biggest live discount, with a countdown to midnight PKT. */
export function DealCard({ product }: { product: ProductSummary }) {
  const off = discountPercent(product.price, product.compareAt);
  const save = (product.compareAt ?? product.price) - product.price;

  return (
    <div className="relative mx-auto w-full max-w-md animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both delay-150">
      <div className="absolute -inset-3 -z-10 rounded-[28px] bg-volt/20 blur-2xl" aria-hidden />
      <div className="overflow-hidden rounded-2xl bg-white text-ink shadow-[0_30px_80px_-30px_rgb(0_0_0/0.8)]">
        <div className="flex items-center justify-between gap-3 bg-flame px-4 py-2.5 text-white">
          <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-wider uppercase">
            <Flame className="size-4 fill-white" /> Deal of the day
          </span>
          <Countdown className="flex items-center font-mono text-xs font-semibold" />
        </div>
        <Link href={`/product/${product.slug}`} className="group block">
          <div className="relative">
            <ProductImage src={product.images[0]} alt={product.name} category={product.category} brand={product.brand} priority sizes="420px" />
            <span className="absolute top-3 left-3 grid size-16 place-items-center rounded-full bg-volt text-center font-display text-lg leading-none">
              −{off}%
            </span>
          </div>
          <div className="grid gap-1 border-t p-5 pb-3">
            <p className="eyebrow text-muted-foreground">{product.brand}</p>
            <h2 className="text-xl leading-tight">{product.name}</h2>
          </div>
        </Link>
        <div className="flex items-end justify-between gap-3 px-5 pb-5">
          <div>
            <p className="text-2xl font-semibold tabular-nums">{formatPKR(product.price)}</p>
            <p className="text-xs">
              <s className="text-muted-foreground">{formatPKR(product.compareAt ?? 0)}</s>{" "}
              <span className="font-semibold text-flame">Save {formatPKR(save)}</span>
            </p>
          </div>
          <QuickAddButton product={product} />
        </div>
      </div>
    </div>
  );
}
