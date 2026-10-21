"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, LayoutDashboard, Package, PackagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package, exact: true },
  { href: "/admin/products/new", label: "Add product", icon: PackagePlus, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList, exact: false },
];

export function AdminNav({ horizontal }: { horizontal?: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href || (href === "/admin/products" && /^\/admin\/products\/(?!new)/.test(pathname)) : pathname.startsWith(href);

  return (
    <nav aria-label="Admin" className={cn("flex gap-1", horizontal ? "flex-row" : "flex-col")}>
      {items.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(href, exact);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
              active ? "bg-volt font-medium text-ink" : "text-white/70 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
