"use client";

import { useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { ProductImage } from "@/components/site/product-image";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, name, category, brand }: { images: string[]; name: string; category: string; brand: string }) {
  const [active, setActive] = useState(0);
  const list = images.length ? images : [null];

  return (
    <div className="grid gap-3 lg:sticky lg:top-24">
      <div className="relative overflow-hidden rounded-xl border bg-white">
        <AnimatePresence mode="popLayout" initial={false}>
          <m.div
            key={active}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ProductImage
              src={list[active]}
              alt={`${name}${list.length > 1 ? ` — image ${active + 1}` : ""}`}
              category={category}
              brand={brand}
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </m.div>
        </AnimatePresence>
      </div>
      {list.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto" role="tablist" aria-label="Product images">
          {list.map((src, i) => (
            <button
              key={src ?? i}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Show image ${i + 1}`}
              onClick={() => setActive(i)}
              className={cn(
                "w-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors sm:w-20",
                i === active ? "border-ink" : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <ProductImage src={src} alt="" category={category} sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
