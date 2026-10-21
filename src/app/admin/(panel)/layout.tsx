import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, LogOut } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { AdminNav } from "@/components/admin/admin-nav";
import { logout } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth";
import { countNewMessages } from "@/lib/messages";
import { orderStats } from "@/lib/orders";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const [newMessages, stats] = await Promise.all([countNewMessages(), orderStats()]);
  const badges = { "/admin/messages": newMessages, "/admin/orders": stats.toVerify };

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 z-30 border-b bg-matte text-white lg:h-dvh lg:border-r lg:border-b-0">
        <div className="flex h-14 items-center justify-between px-4 lg:h-auto lg:flex-col lg:items-stretch lg:gap-8 lg:px-5 lg:py-6">
          <Link href="/admin" aria-label="Admin home">
            <Logo inverse />
          </Link>
          <div className="flex items-center gap-1 lg:hidden">
            <Link href="/" className="rounded-md p-2 text-white/70 hover:text-white" aria-label="View store">
              <ArrowUpRight className="size-4" />
            </Link>
            <form action={logout}>
              <button type="submit" className="rounded-md p-2 text-white/70 hover:text-white" aria-label="Sign out">
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
          <div className="hidden lg:block">
            <AdminNav badges={badges} />
          </div>
        </div>
        <div className="no-scrollbar overflow-x-auto px-4 pb-2 lg:hidden">
          <AdminNav horizontal badges={badges} />
        </div>
        <div className="absolute inset-x-5 bottom-6 hidden gap-1 lg:grid">
          <Link href="/" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white">
            <ArrowUpRight className="size-4" /> View store
          </Link>
          <form action={logout}>
            <button type="submit" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white">
              <LogOut className="size-4" /> Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 p-4 sm:p-6 lg:p-10">{children}</main>
    </div>
  );
}
