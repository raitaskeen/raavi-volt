"use client";

import Link from "next/link";
import { AnimatePresence, m } from "motion/react";
import { ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";
import { ProductImage } from "@/components/site/product-image";
import { QtyStepper } from "@/components/site/cart-sheet";
import { cartSubtotal, useCart, useHydrated } from "@/lib/cart";
import { shipping } from "@/config/store";
import { formatPKR } from "@/lib/utils";

export function CartView() {
  const { lines, remove } = useCart();
  const hydrated = useHydrated();

  if (!hydrated) return <Skeleton className="h-64 w-full" />;

  if (lines.length === 0) {
    return (
      <div className="grid place-items-center gap-4 rounded-xl border border-dashed bg-card py-20 text-center">
        <ShoppingBag className="size-10 text-muted-foreground" strokeWidth={1.25} />
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Button asChild>
          <Link href="/shop">Browse products</Link>
        </Button>
      </div>
    );
  }

  const subtotal = cartSubtotal(lines);

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
      <ul className="divide-y rounded-xl border bg-card">
        <AnimatePresence initial={false}>
          {lines.map((line) => (
            <m.li key={line.id} layout exit={{ opacity: 0, height: 0 }} className="flex gap-4 overflow-hidden p-4 sm:p-5">
              <Link href={`/product/${line.slug}`} className="w-24 shrink-0 overflow-hidden rounded-md border sm:w-28">
                <ProductImage src={line.image} alt={line.name} category={line.category} sizes="112px" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="eyebrow text-muted-foreground">{line.brand}</p>
                <Link href={`/product/${line.slug}`} className="font-medium leading-snug">
                  {line.name}
                </Link>
                <p className="text-sm text-muted-foreground tabular-nums">{formatPKR(line.price)} each</p>
                <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                  <QtyStepper line={line} />
                  <span className="font-semibold tabular-nums">{formatPKR(line.price * line.qty)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => remove(line.id)}
                className="self-start p-1 text-muted-foreground hover:text-ink"
                aria-label={`Remove ${line.name}`}
              >
                <Trash2 className="size-4" />
              </button>
            </m.li>
          ))}
        </AnimatePresence>
      </ul>

      <aside className="grid gap-4 rounded-xl border bg-card p-5 sm:p-6 lg:sticky lg:top-24">
        <h2 className="font-semibold">Order summary</h2>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="tabular-nums">{formatPKR(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Delivery</span>
          <span>{subtotal >= shipping.freeOver ? "Free" : `From ${formatPKR(shipping.lahoreFee)}`}</span>
        </div>
        <Button asChild size="lg" className="mt-2">
          <Link href="/checkout">Proceed to checkout</Link>
        </Button>
        <p className="text-center text-xs text-muted-foreground">Pay securely by bank transfer, Raast QR, JazzCash or Easypaisa.</p>
      </aside>
    </div>
  );
}
