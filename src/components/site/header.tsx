import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { CartButton } from "@/components/site/cart-sheet";
import { MobileNav } from "@/components/site/mobile-nav";
import { SearchForm } from "@/components/site/search-form";
import { InstallApp } from "@/components/site/install-app";
import { DealsStrip } from "@/components/site/deals-strip";
import { categories } from "@/config/store";

const navCategories = categories.slice(0, 4);

export function Header() {
  return (
    <>
      <DealsStrip />
      <header className="sticky top-0 z-40 border-b bg-paper/85 backdrop-blur-md supports-[backdrop-filter]:bg-paper/70">
        <div className="container-x flex h-16 items-center gap-3">
          <MobileNav />
          <Link href="/" aria-label="Raavi Volt home" className="shrink-0">
            <Logo />
          </Link>
          <nav aria-label="Categories" className="ml-4 hidden items-center gap-0.5 whitespace-nowrap lg:flex xl:ml-8">
            <Link href="/shop" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">
              Shop all
            </Link>
            {navCategories.map((c, i) => (
              <Link
                key={c.slug}
                href={`/shop?category=${c.slug}`}
                className={`rounded-md px-3 py-2 text-sm text-charcoal hover:bg-accent hover:text-ink ${i > 0 ? "hidden xl:block" : ""}`}
              >
                {c.name}
              </Link>
            ))}
            <Link href="/shop?sale=1" className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">
              <span className="size-1.5 animate-pulse-dot rounded-full bg-flame" aria-hidden />
              Deals
            </Link>
            <Link href="/track" className="rounded-md px-3 py-2 text-sm text-charcoal hover:bg-accent hover:text-ink">
              Track order
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <SearchForm className="mr-2 hidden w-56 md:block xl:w-72" />
            <InstallApp />
            <CartButton />
          </div>
        </div>
      </header>
    </>
  );
}
