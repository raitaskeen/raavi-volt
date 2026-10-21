"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartLine = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  image: string | null;
  category: string;
  stock: number;
  qty: number;
};

type CartState = {
  lines: CartLine[];
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const MAX_QTY = 20;
const clampQty = (qty: number, stock: number) => Math.max(1, Math.min(qty, stock, MAX_QTY));

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      open: false,
      setOpen: (open) => set({ open }),
      add: (line, qty = 1) =>
        set((s) => {
          const existing = s.lines.find((l) => l.id === line.id);
          const lines = existing
            ? s.lines.map((l) => (l.id === line.id ? { ...l, ...line, qty: clampQty(l.qty + qty, line.stock) } : l))
            : [...s.lines, { ...line, qty: clampQty(qty, line.stock) }];
          return { lines };
        }),
      setQty: (id, qty) =>
        set((s) => ({ lines: s.lines.map((l) => (l.id === id ? { ...l, qty: clampQty(qty, l.stock) } : l)) })),
      remove: (id) => set((s) => ({ lines: s.lines.filter((l) => l.id !== id) })),
      clear: () => set({ lines: [] }),
    }),
    {
      name: "rv-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lines: s.lines }),
    },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.qty, 0);
export const cartSubtotal = (lines: CartLine[]) => lines.reduce((n, l) => n + l.qty * l.price, 0);

/** True after the first client render — avoids hydration mismatches for persisted state. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
