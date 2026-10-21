import { Suspense } from "react";
import Link from "next/link";
import Form from "next/form";
import { FlashToast } from "@/components/admin/flash-toast";
import { PackagePlus, Pencil, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader, TableShell } from "@/components/admin/ui";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { ProductImage } from "@/components/site/product-image";
import { categories, getCategory } from "@/config/store";
import { listProducts } from "@/lib/products";
import { cn, formatPKR } from "@/lib/utils";

export const metadata = { title: "Products" };

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; page?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const { items, total, pageCount } = await listProducts({
    includeInactive: true,
    q: sp.q,
    category: getCategory(sp.category ?? "")?.slug,
    sort: "newest",
    page,
    pageSize: 50,
  });

  return (
    <>
      <Suspense>
        <FlashToast />
      </Suspense>
      <PageHeader title="Products" description={`${total} products in your catalog`}>
        <Button asChild>
          <Link href="/admin/products/new">
            <PackagePlus /> Add product
          </Link>
        </Button>
      </PageHeader>

      <Form action="/admin/products" className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="admin-q" className="sr-only">
            Search products
          </label>
          <input
            id="admin-q"
            name="q"
            type="search"
            defaultValue={sp.q}
            placeholder="Search name, brand or SKU"
            className="h-10 w-full rounded-md border border-input bg-card pr-3 pl-9 text-sm outline-none focus-visible:border-charcoal focus-visible:ring-[3px] focus-visible:ring-ring/15"
          />
        </div>
        <NativeSelect name="category" defaultValue={sp.category ?? ""} aria-label="Filter by category">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.long}
            </option>
          ))}
        </NativeSelect>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </Form>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-card p-12 text-center text-sm text-muted-foreground">No products match.</p>
      ) : (
        <TableShell>
          <thead>
            <tr>
              <th className="w-[52%]">Product</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th className="text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link href={`/admin/products/${p.id}`} className="flex min-w-60 items-center gap-3">
                    <span className="w-12 shrink-0 overflow-hidden rounded-md border">
                      <ProductImage src={p.images[0]} alt="" category={p.category} sizes="48px" />
                    </span>
                    <span className="min-w-0">
                      <span className="line-clamp-1 font-medium">{p.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {p.brand} · {getCategory(p.category)?.name ?? p.category}
                        {p.featured && " · ★ Featured"}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="whitespace-nowrap tabular-nums">{formatPKR(p.price)}</td>
                <td className={cn("font-mono text-xs", p.stock <= 5 && "font-semibold")}>{p.stock}</td>
                <td>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                      p.active ? "bg-ink text-white" : "border text-muted-foreground",
                    )}
                  >
                    {p.active ? "Live" : "Hidden"}
                  </span>
                </td>
                <td>
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="icon-sm" aria-label={`Edit ${p.name}`}>
                      <Link href={`/admin/products/${p.id}`}>
                        <Pencil />
                      </Link>
                    </Button>
                    <DeleteProductButton id={p.id} name={p.name} />
                  </div>
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
              href={`/admin/products?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(sp.category ? { category: sp.category } : {}), page: String(n) })}`}
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
