import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Phone, Truck } from "lucide-react";
import { WhatsAppIcon } from "@/components/site/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader, StatusBadge } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/submit-button";
import { ResendButton } from "@/components/admin/resend-button";
import { setOrderStatus } from "@/app/admin/(panel)/orders/actions";
import { couriers, orderStatuses, paymentAccounts } from "@/config/store";
import { getOrderByCode } from "@/lib/orders";
import { orderStageText } from "@/lib/notifications";
import { listNotifications, manualLink, whatsappConfigured } from "@/lib/whatsapp";
import { templates } from "@/lib/whatsapp-templates";
import { cn, formatDate, formatPKR } from "@/lib/utils";

export const metadata = { title: "Order" };

const nextStep: Partial<Record<string, { status: string; label: string }>> = {
  awaiting_payment: { status: "confirmed", label: "Mark paid & confirm" },
  payment_submitted: { status: "confirmed", label: "Verify payment & confirm" },
  confirmed: { status: "shipped", label: "Mark as shipped" },
  shipped: { status: "delivered", label: "Mark as delivered" },
};

const notifTone = {
  sent: "bg-[#25d366]/15 text-[#0f7a3a]",
  failed: "bg-flame/15 text-flame",
  skipped: "bg-muted text-muted-foreground",
} as const;

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

function NotifyToggle() {
  return (
    <label className="flex items-center gap-2 text-xs">
      <input type="checkbox" name="silent" value="1" className="size-3.5 accent-[var(--ink)]" />
      Don&apos;t send the customer a WhatsApp update
    </label>
  );
}

export default async function AdminOrderPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const order = await getOrderByCode(code);
  if (!order) notFound();
  const [log] = await Promise.all([listNotifications({ orderCode: order.code })]);
  const account = paymentAccounts.find((a) => a.id === order.paymentAccount);
  const step = nextStep[order.status];
  const apiReady = whatsappConfigured();
  const stageText = orderStageText(order);

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink">
        <ArrowLeft className="size-4" /> All orders
      </Link>
      <PageHeader title={order.code} description={`Placed ${formatDate(order.createdAt)} · updated ${formatDate(order.updatedAt)}`}>
        <StatusBadge status={order.status} />
        <Button asChild variant="ghost" size="sm">
          <Link href={`/order/${order.code}`} target="_blank">
            Customer view <ExternalLink />
          </Link>
        </Button>
      </PageHeader>

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_380px]">
        <div className="grid gap-6">
          <section className="rounded-xl border bg-card">
            <h2 className="border-b px-5 py-4 font-semibold">Items</h2>
            <ul className="divide-y">
              {order.items.map((i) => (
                <li key={i.productId} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                  <Link href={`/admin/products/${i.productId}`} className="hover:underline">
                    {i.name}
                  </Link>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {i.qty} × {formatPKR(i.price)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="grid gap-1 border-t px-5 py-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatPKR(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd>{order.shipping ? formatPKR(order.shipping) : "Free"}</dd>
              </div>
              <div className="flex justify-between pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatPKR(order.total)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border bg-card px-5 py-3">
            <h2 className="py-2 font-semibold">Payment</h2>
            <dl className="divide-y">
              <Row label="Pay into">{account ? `${account.bank} · ${account.accountNumber}` : order.paymentAccount}</Row>
              <Row label="Reference">{order.paymentRef ? <span className="font-mono">{order.paymentRef}</span> : "—"}</Row>
              <Row label="Paid by">{order.paymentPayer ?? "—"}</Row>
              <Row label="Screenshot">
                {order.paymentProof ? (
                  <a href={`/admin/proof/${order.paymentProof}`} target="_blank" rel="noopener noreferrer" className="group block w-fit">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/admin/proof/${order.paymentProof}`} alt="Payment screenshot" className="max-h-80 rounded-lg border" />
                    <span className="mt-2 inline-flex items-center gap-1 text-xs group-hover:underline">
                      Open full size <ExternalLink className="size-3" />
                    </span>
                  </a>
                ) : (
                  "Not uploaded"
                )}
              </Row>
              {(order.courier || order.trackingNumber) && (
                <Row label="Shipment">
                  {order.courier ?? "—"} · <span className="font-mono">{order.trackingNumber ?? "no tracking no."}</span>
                </Row>
              )}
              {order.cancelReason && <Row label="Cancelled">{order.cancelReason}</Row>}
            </dl>
          </section>

          {/* WhatsApp */}
          <section className="rounded-xl border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
              <h2 className="flex items-center gap-2 font-semibold">
                <WhatsAppIcon className="size-5 text-[#1da851]" /> WhatsApp updates
              </h2>
              <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium", order.whatsappOptIn ? "bg-[#25d366]/15 text-[#0f7a3a]" : "bg-muted text-muted-foreground")}>
                {order.whatsappOptIn ? "Customer opted in" : "Customer opted out"}
              </span>
            </div>
            <div className="grid gap-4 p-5">
              {!apiReady && (
                <p className="rounded-lg bg-flame/10 px-3 py-2 text-xs text-ink">
                  The WhatsApp Cloud API isn&apos;t connected yet, so automatic messages are logged as <em>skipped</em>. Use “Send manually” to send
                  this update from your own WhatsApp.
                </p>
              )}
              <div className="rounded-lg bg-paper p-3">
                <p className="eyebrow mb-1.5 text-muted-foreground">Current stage message</p>
                <p className="text-sm">{stageText}</p>
              </div>
              <div className="flex flex-wrap items-start gap-2">
                <Button asChild size="sm" className="bg-[#1da851] hover:bg-[#178a43]">
                  <a href={manualLink(order.phone, stageText)} target="_blank" rel="noopener noreferrer">
                    <WhatsAppIcon /> Send manually
                  </a>
                </Button>
                {apiReady && <ResendButton code={order.code} />}
              </div>
              {log.length > 0 && (
                <ol className="grid gap-2 border-t pt-4">
                  {log.map((n) => (
                    <li key={n.id} className="grid gap-1 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("rounded-full px-2 py-0.5 font-medium", notifTone[n.status])}>{n.status}</span>
                        <span className="font-mono">{templates[n.template]?.name ?? n.template}</span>
                        <span className="text-muted-foreground">
                          → {n.audience === "admin" ? "you" : "customer"} · {formatDate(n.created_at)}
                        </span>
                      </div>
                      {n.error && <p className="text-muted-foreground">{n.error}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>
        </div>

        <div className="grid gap-6 xl:sticky xl:top-10">
          {step && (
            <form key={`next-${order.status}`} action={setOrderStatus.bind(null, order.code)} className="grid gap-3 rounded-xl border-2 border-ink bg-volt p-5">
              <input type="hidden" name="status" value={step.status} />
              <p className="eyebrow text-ink/60">Next step</p>
              {step.status === "shipped" && (
                <div className="grid gap-2">
                  <label htmlFor="courier" className="flex items-center gap-1.5 text-xs font-medium">
                    <Truck className="size-3.5" /> Courier
                  </label>
                  <NativeSelect id="courier" name="courier" defaultValue={order.city === "Lahore" ? couriers[0] : "TCS"} className="bg-white">
                    {couriers.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </NativeSelect>
                  <label htmlFor="trackingNumber" className="text-xs font-medium">
                    Tracking number <span className="font-normal text-ink/60">(optional)</span>
                  </label>
                  <Input id="trackingNumber" name="trackingNumber" maxLength={60} autoComplete="off" spellCheck={false} className="bg-white font-mono" />
                </div>
              )}
              <SubmitButton>{step.label}</SubmitButton>
              {order.status === "payment_submitted" && <p className="text-xs text-ink/70">Check ref {order.paymentRef} in your bank app first.</p>}
              <NotifyToggle />
            </form>
          )}
          <section className="grid gap-4 rounded-xl border bg-card p-5">
            <h2 className="font-semibold">Update status</h2>
            <form key={order.status} action={setOrderStatus.bind(null, order.code)} className="grid gap-3">
              <label htmlFor="status" className="sr-only">
                Order status
              </label>
              <NativeSelect id="status" name="status" defaultValue={order.status}>
                {orderStatuses.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </NativeSelect>
              <label htmlFor="reason" className="text-xs font-medium">
                Reason <span className="font-normal text-muted-foreground">(sent to the customer if cancelling)</span>
              </label>
              <Input id="reason" name="reason" maxLength={160} placeholder="e.g. item out of stock — full refund issued" />
              <SubmitButton>Save status</SubmitButton>
              <NotifyToggle />
              <p className="text-xs text-muted-foreground">Cancelling returns items to stock.</p>
            </form>
          </section>

          <section className="rounded-xl border bg-card px-5 py-3">
            <h2 className="py-2 font-semibold">Customer</h2>
            <dl className="divide-y">
              <Row label="Name">{order.customerName}</Row>
              <Row label="Phone">{order.phone}</Row>
              <Row label="Email">{order.email ?? "—"}</Row>
              <Row label="Address">
                {order.address}
                {order.area ? `, ${order.area}` : ""}, {order.city}
                {order.postalCode ? ` ${order.postalCode}` : ""}
              </Row>
              {order.notes && <Row label="Notes">{order.notes}</Row>}
            </dl>
            <div className="grid grid-cols-2 gap-2 py-3">
              <Button asChild variant="outline" size="sm">
                <a href={`tel:${order.phone}`}>
                  <Phone /> Call
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href={manualLink(order.phone, `Assalam o Alaikum ${order.customerName}, regarding your order ${order.code}`)} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon /> WhatsApp
                </a>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
