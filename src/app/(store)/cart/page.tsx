import type { Metadata } from "next";
import { CartView } from "@/components/site/cart-view";

export const metadata: Metadata = { title: "Your cart", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="container-x py-8 sm:py-12">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight sm:text-4xl">Your cart</h1>
      <CartView />
    </div>
  );
}
