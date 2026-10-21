import Link from "next/link";
import { PageHeader, StatusBadge, TableShell } from "@/components/admin/ui";
import { orderHoldHours, orderStatuses, paymentAccounts } from "@/config/store";
import { expireStaleOrders, listOrders } from "@/lib/orders";
import { cn, formatDate, formatPKR } from "@/lib/utils";

export const metadata = { title: "Orders" };

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const sp = await searchParams;
  const status = orderStatuses.some((s) => s.value === sp.status) ? sp.status : undefined;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  await expireStaleOrders(orderHoldHours);
  const { items, total, pageCount } = await listOrders({ status, page });

  return (
    <>
      <PageHeader title="Orders" description={`${total} ${status ? "matching" : "total"} orders`} />

      <nav aria-label="Filter by status" className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {[{ value: undefined, label: "All" }, ...orderStatuses].map((s) => (
          <Link
            key={s.label}
            href={s.value ? `/admin/orders?status=${s.value}` : "/admin/orders"}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium",
              status === s.value ? "border-ink bg-ink text-white" : "bg-card hover:border-charcoal/40",
            )}
          >
            {s.label}
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-card p-12 text-center text-sm text-muted-foreground">No orders here yet.</p>
      ) : (
        <TableShell>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Paid to</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((o) => (
              <tr key={o.code}>
                <td className="whitespace-nowrap">
                  <Link href={`/admin/orders/${o.code}`} className="font-mono font-medium hover:underline">
                    {o.code}
                  </Link>
                  <div className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</div>
                </td>
                <td>
                  <div className="font-medium">{o.customerName}</div>
                  <div className="text-xs text-muted-foreground">
                    {o.phone} · {o.city}
                  </div>
                </td>
                <td className="font-mono text-xs">{o.items.reduce((n, i) => n + i.qty, 0)}</td>
                <td className="whitespace-nowrap tabular-nums">{formatPKR(o.total)}</td>
                <td className="text-xs whitespace-nowrap">
                  {paymentAccounts.find((a) => a.id === o.paymentAccount)?.bank ?? o.paymentAccount}
                  {o.paymentRef && <div className="font-mono text-muted-foreground">{o.paymentRef}</div>}
                </td>
                <td>
                  <StatusBadge status={o.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      {pageCount > 1 && (
        <nav className="mt-6 flex gap-2" aria-label="Pagination">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={`/admin/orders?${new URLSearchParams({ ...(status ? { status } : {}), page: String(n) })}`}
              className={cn("grid size-9 place-items-center rounded-md border font-mono text-sm", n === page ? "bg-ink text-white" : "bg-card")}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
