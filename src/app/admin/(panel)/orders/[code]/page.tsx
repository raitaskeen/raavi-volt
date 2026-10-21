import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/site/icons";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader, StatusBadge } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/submit-button";
import { setOrderStatus } from "@/app/admin/(panel)/orders/actions";
import { orderStatuses, paymentAccounts } from "@/config/store";
import { getOrderByCode } from "@/lib/orders";
import { formatDate, formatPKR } from "@/lib/utils";

export const metadata = { title: "Order" };

const nextStep: Partial<Record<string, { status: string; label: string }>> = {
  awaiting_payment: { status: "confirmed", label: "Mark paid & confirm" },
  payment_submitted: { status: "confirmed", label: "Verify payment & confirm" },
  confirmed: { status: "shipped", label: "Mark as shipped" },
  shipped: { status: "delivered", label: "Mark as delivered" },
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

export default async function AdminOrderPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const order = await getOrderByCode(code);
  if (!order) notFound();
  const account = paymentAccounts.find((a) => a.id === order.paymentAccount);
  const intlPhone = `92${order.phone.slice(1)}`;

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink">
        <ArrowLeft className="size-4" /> All orders
      </Link>
      <PageHeader title={order.code} description={`Placed ${formatDate(order.createdAt)} · updated ${formatDate(order.updatedAt)}`}>
        <StatusBadge status={order.status} />
      </PageHeader>

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_360px]">
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
            </dl>
          </section>
        </div>

        <div className="grid gap-6 xl:sticky xl:top-10">
          {nextStep[order.status] && (
            <form key={`next-${order.status}`} action={setOrderStatus.bind(null, order.code)} className="grid gap-2 rounded-xl border-2 border-ink bg-volt p-5">
              <input type="hidden" name="status" value={nextStep[order.status]!.status} />
              <p className="eyebrow text-ink/60">Next step</p>
              <SubmitButton>{nextStep[order.status]!.label}</SubmitButton>
              {order.status === "payment_submitted" && <p className="text-xs text-ink/70">Check ref {order.paymentRef} in your bank app first.</p>}
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
              <SubmitButton>Save status</SubmitButton>
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
                <a href={`https://wa.me/${intlPhone}?text=${encodeURIComponent(`Assalam o Alaikum ${order.customerName}, regarding your order ${order.code}`)}`} target="_blank" rel="noopener noreferrer">
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
