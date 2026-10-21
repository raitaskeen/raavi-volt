"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import { Check, Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/site/icons";
import { useCart, type CartLine } from "@/lib/cart";
import type { ProductSummary } from "@/lib/products";
import { store } from "@/config/store";
import { cn, formatPKR } from "@/lib/utils";

type Item = Pick<ProductSummary, "id" | "slug" | "name" | "brand" | "price" | "images" | "category" | "stock">;

function toLine(p: Item): Omit<CartLine, "qty"> {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    price: p.price,
    image: p.images[0] ?? null,
    category: p.category,
    stock: p.stock,
  };
}

function useAddWithToast() {
  const add = useCart((s) => s.add);
  const setOpen = useCart((s) => s.setOpen);
  return (product: Item, qty = 1) => {
    add(toLine(product), qty);
    toast(product.name, {
      description: qty > 1 ? `${qty} added to your cart` : "Added to your cart",
      action: { label: "View cart", onClick: () => setOpen(true) },
    });
  };
}

function SwapIcon({ done, idle }: { done: boolean; idle: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.span
        key={done ? "done" : "idle"}
        className="inline-flex"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.4, opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        {done ? <Check /> : idle}
      </m.span>
    </AnimatePresence>
  );
}

function useFlash() {
  const [done, setDone] = useState(false);
  return [done, () => (setDone(true), setTimeout(() => setDone(false), 1200))] as const;
}

/** Compact round "+" used on product cards. */
export function QuickAdd({ product, className }: { product: Item; className?: string }) {
  const addWithToast = useAddWithToast();
  const [done, flash] = useFlash();
  const soldOut = product.stock <= 0;

  return (
    <Button
      type="button"
      size="icon-sm"
      variant={done ? "volt" : "default"}
      disabled={soldOut}
      aria-label={soldOut ? "Sold out" : `Add ${product.name} to cart`}
      className={cn("rounded-full", className)}
      onClick={(e) => {
        e.preventDefault();
        addWithToast(product);
        flash();
      }}
    >
      <SwapIcon done={done} idle={<Plus />} />
    </Button>
  );
}

/** Labeled volt "Add to cart" used in the hero deal. */
export function QuickAddButton({ product }: { product: Item }) {
  const addWithToast = useAddWithToast();
  const [done, flash] = useFlash();
  return (
    <Button
      type="button"
      variant="volt"
      size="lg"
      disabled={product.stock <= 0}
      onClick={() => {
        addWithToast(product);
        flash();
      }}
    >
      <SwapIcon done={done} idle={<ShoppingBag />} />
      {done ? "Added" : "Add to cart"}
    </Button>
  );
}

/** Quantity stepper + Add to cart + Buy now + WhatsApp order, with a sticky mobile bar. */
export function AddToCart({ product }: { product: Item }) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const setOpen = useCart((s) => s.setOpen);
  const [qty, setQty] = useState(1);
  const [showBar, setShowBar] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);
  const soldOut = product.stock <= 0;
  const max = Math.min(product.stock, 20);

  useEffect(() => {
    const el = anchor.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setShowBar(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const addToCart = () => {
    add(toLine(product), qty);
    setOpen(true);
  };
  const buyNow = () => {
    add(toLine(product), qty);
    router.push("/checkout");
  };

  const waText = encodeURIComponent(
    `Assalam o Alaikum! I'd like to order:\n${qty} × ${product.name} (${formatPKR(product.price)})\n${store.url}/product/${product.slug}`,
  );

  if (soldOut) {
    return (
      <div className="grid gap-3">
        <Button size="xl" disabled className="w-full">
          Sold out
        </Button>
        <Button asChild size="lg" variant="outline">
          <a href={`https://wa.me/${store.contact.whatsapp}?text=${encodeURIComponent(`Is ${product.name} coming back in stock?`)}`} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon className="size-4" /> Ask when it&apos;s back
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-3" ref={anchor}>
      <div className="flex items-center gap-3">
        <div className="flex h-14 items-center rounded-md border border-input bg-card" role="group" aria-label="Quantity">
          <Button type="button" variant="ghost" size="icon" className="h-full rounded-r-none" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity">
            <Minus />
          </Button>
          <output className="w-10 text-center font-mono text-base tabular-nums" aria-live="polite">
            {qty}
          </output>
          <Button type="button" variant="ghost" size="icon" className="h-full rounded-l-none" onClick={() => setQty((q) => Math.min(max, q + 1))} disabled={qty >= max} aria-label="Increase quantity">
            <Plus />
          </Button>
        </div>
        <Button size="xl" variant="outline" className="flex-1" onClick={addToCart}>
          <ShoppingBag /> Add to cart
        </Button>
      </div>
      <Button size="xl" variant="volt" className="w-full" onClick={buyNow}>
        <Zap className="fill-ink" /> Buy now · {formatPKR(product.price * qty)}
      </Button>
      <a
        href={`https://wa.me/${store.contact.whatsapp}?text=${waText}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 py-1 text-sm font-medium text-charcoal underline-offset-4 hover:underline"
      >
        <WhatsAppIcon className="size-4" /> Or order on WhatsApp
      </a>

      <AnimatePresence>
        {showBar && (
          <m.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t bg-card/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-muted-foreground">{product.name}</p>
              <p className="font-semibold tabular-nums">{formatPKR(product.price)}</p>
            </div>
            <Button variant="outline" size="icon" onClick={addToCart} aria-label="Add to cart">
              <ShoppingBag />
            </Button>
            <Button variant="volt" onClick={buyNow}>
              Buy now
            </Button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
