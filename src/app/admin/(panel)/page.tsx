import Link from "next/link";
import { ArrowRight, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, StatCard, StatusBadge, TableShell } from "@/components/admin/ui";
import { expireStaleOrders, listOrders, orderStats } from "@/lib/orders";
import { countNewMessages } from "@/lib/messages";
import { whatsappConfigured } from "@/lib/whatsapp";
import { orderHoldHours } from "@/config/store";
import { lowStockProducts, productStats } from "@/lib/products";
import { formatDate, formatPKR } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  await expireStaleOrders(orderHoldHours);
  const [ps, os, recent, toVerify, low, newMessages] = await Promise.all([
    productStats(),
    orderStats(),
    listOrders({ pageSize: 6 }),
    listOrders({ status: "payment_submitted", pageSize: 5 }),
    lowStockProducts(6),
    countNewMessages(),
  ]);

  return (
    <>
      <PageHeader title="Dashboard" description="Your store at a glance.">
        <Button asChild>
          <Link href="/admin/products/new">
            <PackagePlus /> Add product
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="To verify" value={os.toVerify} hint="Payments submitted by customers" highlight={os.toVerify > 0} />
        <StatCard label="Awaiting payment" value={os.awaiting} hint="Orders not yet paid" />
        <StatCard label="Revenue" value={formatPKR(os.revenue)} hint="Confirmed, shipped & delivered" />
        <StatCard label="Products" value={`${ps.active}/${ps.total}`} hint={`${ps.lowStock} low on stock`} />
      </div>

      <div className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2 sm:gap-4">
        <Link href="/admin/messages" className="rounded-xl transition-transform hover:-translate-y-0.5">
          <StatCard label="New messages" value={newMessages} hint="From the contact form" highlight={newMessages > 0} />
        </Link>
        <StatCard
          label="WhatsApp updates"
          value={whatsappConfigured() ? "Connected" : "Not connected"}
          hint={whatsappConfigured() ? "Customers get automatic order updates" : "Add WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID — see docs/WHATSAPP_SETUP.md"}
        />
      </div>

      {toVerify.items.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 font-semibold">Payments to verify</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {toVerify.items.map((o) => (
              <Link key={o.code} href={`/admin/orders/${o.code}`} className="group rounded-xl border border-ink bg-card p-4 transition-colors hover:bg-ink hover:text-white">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">{o.code}</span>
                  <ArrowRight className="size-4" />
                </div>
                <p className="mt-3 text-xl font-semibold tabular-nums">{formatPKR(o.total)}</p>
                <p className="mt-1 text-xs opacity-70">
                  {o.customerName} · Ref {o.paymentRef}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 grid gap-8 xl:grid-cols-[1.6fr_1fr]">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm font-medium hover:underline">
              View all
            </Link>
          </div>
          {recent.items.length === 0 ? (
            <p className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <TableShell>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.items.map((o) => (
                  <tr key={o.code}>
                    <td>
                      <Link href={`/admin/orders/${o.code}`} className="font-mono font-medium hover:underline">
                        {o.code}
                      </Link>
                      <div className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</div>
                    </td>
                    <td>{o.customerName}</td>
                    <td className="tabular-nums">{formatPKR(o.total)}</td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          )}
        </section>

        <section>
          <h2 className="mb-4 font-semibold">Low stock</h2>
          {low.length === 0 ? (
            <p className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">All products well stocked.</p>
          ) : (
            <ul className="divide-y rounded-xl border bg-card">
              {low.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/products/${p.id}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-paper">
                    <span className="line-clamp-1">{p.name}</span>
                    <span className="shrink-0 font-mono text-xs">{p.stock} left</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
