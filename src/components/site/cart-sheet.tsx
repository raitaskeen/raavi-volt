"use client";

import Link from "next/link";
import { AnimatePresence, m } from "motion/react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ProductImage } from "@/components/site/product-image";
import { cartCount, cartSubtotal, useCart, useHydrated, type CartLine } from "@/lib/cart";
import { shipping } from "@/config/store";
import { formatPKR } from "@/lib/utils";

export function CartButton() {
  const lines = useCart((s) => s.lines);
  const setOpen = useCart((s) => s.setOpen);
  const hydrated = useHydrated();
  const count = hydrated ? cartCount(lines) : 0;

  return (
    <Button variant="ghost" size="icon" className="relative" onClick={() => setOpen(true)} aria-label={`Open cart, ${count} items`}>
      <ShoppingBag className="size-5" />
      <AnimatePresence>
        {count > 0 && (
          <m.span
            key={count}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.3, opacity: 0 }}
            className="absolute top-0.5 right-0.5 grid min-w-[18px] place-items-center rounded-full bg-volt px-1 font-mono text-[10px] font-semibold leading-[18px] text-ink ring-2 ring-paper"
          >
            {count}
          </m.span>
        )}
      </AnimatePresence>
    </Button>
  );
}

export function QtyStepper({ line }: { line: CartLine }) {
  const setQty = useCart((s) => s.setQty);
  return (
    <div className="flex h-8 items-center rounded-md border" role="group" aria-label={`Quantity for ${line.name}`}>
      <button
        type="button"
        className="grid h-full w-8 place-items-center disabled:opacity-40"
        onClick={() => setQty(line.id, line.qty - 1)}
        disabled={line.qty <= 1}
        aria-label="Decrease quantity"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="w-7 text-center font-mono text-xs tabular-nums">{line.qty}</span>
      <button
        type="button"
        className="grid h-full w-8 place-items-center disabled:opacity-40"
        onClick={() => setQty(line.id, line.qty + 1)}
        disabled={line.qty >= Math.min(line.stock, 20)}
        aria-label="Increase quantity"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

export function CartSheet() {
  const { lines, open, setOpen, remove } = useCart();
  const hydrated = useHydrated();
  const items = hydrated ? lines : [];
  const subtotal = cartSubtotal(items);
  const remaining = shipping.freeOver - subtotal;
  const progress = Math.min(100, (subtotal / shipping.freeOver) * 100);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Your cart ({cartCount(items)})</SheetTitle>
          <SheetDescription>
            {items.length === 0
              ? "Nothing here yet."
              : remaining > 0
                ? `Add ${formatPKR(remaining)} more for free delivery.`
                : "You've unlocked free delivery."}
          </SheetDescription>
          {items.length > 0 && (
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
              <m.div className="h-full bg-volt-deep" initial={false} animate={{ width: `${progress}%` }} />
            </div>
          )}
        </SheetHeader>

        {items.length === 0 ? (
          <div className="grid flex-1 place-items-center p-8 text-center">
            <div className="grid justify-items-center gap-4">
              <ShoppingBag className="size-10 text-muted-foreground" strokeWidth={1.25} />
              <p className="text-sm text-muted-foreground">Your cart is empty.</p>
              <Button asChild onClick={() => setOpen(false)}>
                <Link href="/shop">Start shopping</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y overflow-y-auto overscroll-contain px-5">
              <AnimatePresence initial={false}>
                {items.map((line) => (
                  <m.li
                    key={line.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
                    className="flex gap-3 py-4"
                  >
                    <Link href={`/product/${line.slug}`} onClick={() => setOpen(false)} className="w-20 shrink-0 overflow-hidden rounded-md border">
                      <ProductImage src={line.image} alt={line.name} category={line.category} sizes="80px" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <p className="eyebrow text-muted-foreground">{line.brand}</p>
                      <Link href={`/product/${line.slug}`} onClick={() => setOpen(false)} className="line-clamp-2 text-sm leading-snug font-medium">
                        {line.name}
                      </Link>
                      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                        <QtyStepper line={line} />
                        <span className="text-sm font-semibold tabular-nums">{formatPKR(line.price * line.qty)}</span>
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
            <div className="grid gap-3 border-t bg-paper p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-base font-semibold tabular-nums">{formatPKR(subtotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Delivery calculated at checkout. Pay by bank transfer / QR.</p>
              <Button asChild size="lg" variant="volt" onClick={() => setOpen(false)}>
                <Link href="/checkout">Checkout · {formatPKR(subtotal)}</Link>
              </Button>
              <Button asChild size="sm" variant="ghost" onClick={() => setOpen(false)}>
                <Link href="/cart">View full cart</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
