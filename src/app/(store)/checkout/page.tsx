import type { Metadata } from "next";
import { Check, Lock } from "lucide-react";
import { CheckoutForm } from "@/components/site/checkout-form";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

const steps = ["Cart", "Details", "Pay by QR"];

export default function CheckoutPage() {
  return (
    <div className="container-x py-8 sm:py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2 flex items-center gap-1.5 text-muted-foreground">
            <Lock className="size-3" /> Secure checkout
          </p>
          <h1 className="text-3xl sm:text-5xl">Checkout</h1>
        </div>
        <ol className="flex items-center gap-2 text-xs font-medium" aria-label="Checkout progress">
          {steps.map((s, i) => (
            <li key={s} className="flex items-center gap-2" aria-current={i === 1 ? "step" : undefined}>
              <span
                className={cn(
                  "grid size-6 place-items-center rounded-full font-mono text-[11px]",
                  i === 0 ? "bg-ink text-white" : i === 1 ? "bg-volt text-ink ring-2 ring-ink" : "border bg-card text-muted-foreground",
                )}
              >
                {i === 0 ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className={i === 2 ? "text-muted-foreground" : ""}>{s}</span>
              {i < steps.length - 1 && <span className="h-px w-5 bg-border sm:w-8" aria-hidden />}
            </li>
          ))}
        </ol>
      </div>
      <CheckoutForm />
    </div>
  );
}
