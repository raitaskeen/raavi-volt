import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { WhatsAppIcon } from "@/components/site/icons";
import { Button } from "@/components/ui/button";
import { PaymentAccountCard } from "@/components/site/payment-account-card";
import { PaymentForm } from "@/components/site/payment-form";
import { ProductImage } from "@/components/site/product-image";
import { CopyButton } from "@/components/site/copy-button";
import { orderHoldHours, paymentAccounts, statusLabel, store } from "@/config/store";
import { getOrderByCode } from "@/lib/orders";
import { cn, formatDate, formatPKR } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your order", robots: { index: false, follow: false } };

const steps = ["awaiting_payment", "payment_submitted", "confirmed", "shipped", "delivered"] as const;

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const [{ code }, { placed }] = await Promise.all([params, searchParams]);
  if (!/^RV-[A-Z0-9]{10}$/.test(code)) notFound();
  const order = await getOrderByCode(code);
  if (!order) notFound();

  const chosen = paymentAccounts.find((a) => a.id === order.paymentAccount) ?? paymentAccounts[0];
  const others = paymentAccounts.filter((a) => a.id !== chosen.id);
  const needsPayment = order.status === "awaiting_payment" || order.status === "payment_submitted";
  const stepIndex = steps.indexOf(order.status as (typeof steps)[number]);
  const waText = encodeURIComponent(`Hi ${store.name}! I've placed order ${order.code} for ${formatPKR(order.total)}. Sharing my payment receipt.`);

  return (
    <div className="container-x max-w-5xl py-8 sm:py-12">
      <div className="mb-8 grid gap-3 animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
        {placed && (
          <p className="inline-flex w-fit items-center gap-2 rounded-full bg-volt px-3 py-1 text-xs font-semibold text-ink">
            <Check className="size-3.5" /> Order placed — thank you, {order.customerName.split(" ")[0]}!
          </p>
        )}
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {needsPayment ? "Complete your payment" : statusLabel(order.status)}
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            Order <span className="font-mono font-medium text-ink">{order.code}</span>
            <CopyButton value={order.code} label="order number" />
          </span>
          <span>{formatDate(order.createdAt)}</span>
        </div>
        <p className="text-xs text-muted-foreground">Bookmark this page — it&apos;s your private link to track this order.</p>
      </div>

      {/* Progress */}
      {order.status !== "cancelled" ? (
        <ol className="mb-10 grid grid-cols-5 gap-2" aria-label="Order progress">
          {steps.map((s, i) => (
            <li key={s} className="grid gap-2" aria-current={i === stepIndex ? "step" : undefined}>
              <span className={cn("h-1.5 rounded-full", i < stepIndex ? "bg-ink" : i === stepIndex ? "bg-volt-deep" : "bg-border")} />
              <span className={cn("text-[10px] leading-tight sm:text-xs", i <= stepIndex ? "font-medium" : "text-muted-foreground")}>
                {statusLabel(s)}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mb-10 rounded-lg border border-ink p-4 text-sm">
          This order was cancelled{order.cancelReason ? ` — ${order.cancelReason}` : ""}. Contact us if you think this is a mistake.
        </p>
      )}

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_340px]">
        <div className="grid gap-6">
          {needsPayment && (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl bg-matte p-6 text-white">
                <div>
                  <p className="eyebrow text-white/55">Amount to pay</p>
                  <p className="mt-2 font-display text-4xl text-volt tabular-nums sm:text-5xl">{formatPKR(order.total)}</p>
                </div>
                <p className="max-w-56 text-xs text-white/60">
                  Use <span className="font-mono text-white">{order.code}</span> as the payment reference / remarks. Unpaid orders are released after {orderHoldHours} hours.
                </p>
              </div>

              <PaymentAccountCard account={chosen} primary />

              {others.length > 0 && (
                <details className="group rounded-xl border bg-card">
                  <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium marker:hidden">
                    <span className="flex items-center justify-between">
                      Pay with another account
                      <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
                    </span>
                  </summary>
                  <div className="grid gap-4 border-t p-4">
                    {others.map((a) => (
                      <PaymentAccountCard key={a.id} account={a} />
                    ))}
                  </div>
                </details>
              )}

              {order.status === "payment_submitted" ? (
                <div role="status" className="grid gap-4 rounded-xl border-2 border-ink bg-volt/25 p-5 text-sm">
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-volt">
                      <Check className="size-5" />
                    </span>
                    <div>
                      <p className="font-semibold">Payment details received</p>
                      <p className="mt-0.5 text-charcoal">
                        Ref <span className="font-mono">{order.paymentRef}</span> — we&apos;re verifying it and will confirm on WhatsApp / SMS shortly.
                      </p>
                    </div>
                  </div>
                  <details className="group rounded-lg bg-card">
                    <summary className="cursor-pointer list-none px-4 py-3 font-medium marker:hidden">Need to correct the details?</summary>
                    <div className="border-t p-2">
                      <PaymentForm code={order.code} defaultRef={order.paymentRef ?? ""} defaultPayer={order.paymentPayer ?? ""} />
                    </div>
                  </details>
                </div>
              ) : (
                <PaymentForm code={order.code} />
              )}

              <Button asChild variant="outline" size="lg">
                <a href={`https://wa.me/${store.contact.whatsapp}?text=${waText}`} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon /> Send receipt on WhatsApp
                </a>
              </Button>
            </>
          )}
          {!needsPayment && order.status !== "cancelled" && (
            <div className="grid gap-4 rounded-xl border bg-card p-6 text-sm">
              <div>
                <p className="font-medium">{order.status === "delivered" ? "Delivered — enjoy!" : "Payment verified — thank you!"}</p>
                <p className="mt-1 text-muted-foreground">
                  {order.whatsappOptIn ? `Updates are sent on WhatsApp to ${order.phone}.` : `We will keep you posted on ${order.phone}.`}
                </p>
              </div>
              {(order.status === "shipped" || order.status === "delivered") && (order.courier || order.trackingNumber) && (
                <dl className="grid grid-cols-2 gap-3 rounded-lg bg-volt/25 p-4">
                  <div>
                    <dt className="eyebrow text-muted-foreground">Courier</dt>
                    <dd className="mt-1 font-medium">{order.courier ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="eyebrow text-muted-foreground">Tracking no.</dt>
                    <dd className="mt-1 flex items-center gap-2 font-mono">
                      {order.trackingNumber ?? "—"}
                      {order.trackingNumber && <CopyButton value={order.trackingNumber} label="tracking number" />}
                    </dd>
                  </div>
                </dl>
              )}
            </div>
          )}
        </div>

        <aside className="grid gap-5 rounded-xl border bg-card p-5 sm:p-6 lg:sticky lg:top-24">
          <h2 className="font-semibold">Summary</h2>
          <ul className="grid gap-3">
            {order.items.map((i) => (
              <li key={i.productId} className="flex items-center gap-3">
                <Link href={`/product/${i.slug}`} className="w-12 shrink-0 overflow-hidden rounded-md border">
                  <ProductImage src={i.image} alt={i.name} category={i.category ?? ""} sizes="48px" />
                </Link>
                <span className="flex-1 text-sm">
                  <span className="line-clamp-2">{i.name}</span>
                  <span className="text-xs text-muted-foreground">Qty {i.qty}</span>
                </span>
                <span className="text-sm tabular-nums">{formatPKR(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="grid gap-2 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{formatPKR(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="tabular-nums">{order.shipping === 0 ? "Free" : formatPKR(order.shipping)}</dd>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatPKR(order.total)}</dd>
            </div>
          </dl>
          <div className="grid gap-1 border-t pt-4 text-sm">
            <p className="eyebrow mb-1 text-muted-foreground">Deliver to</p>
            <p className="font-medium">{order.customerName}</p>
            <p className="text-muted-foreground">
              {order.address}
              {order.area ? `, ${order.area}` : ""}, {order.city}
            </p>
            <p className="text-muted-foreground">{order.phone}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
