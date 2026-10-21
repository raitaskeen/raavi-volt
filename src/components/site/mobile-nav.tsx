"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CategoryIcon } from "@/components/site/category-icon";
import { Logo } from "@/components/site/logo";
import { SearchForm } from "@/components/site/search-form";
import { categories, store } from "@/config/store";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="-ml-2 lg:hidden" aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle asChild>
            <div>
              <Logo />
            </div>
          </SheetTitle>
          <SheetDescription className="sr-only">Browse categories and search</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-5">
          <div onSubmit={() => setOpen(false)}>
            <SearchForm id="q-mobile" />
          </div>
          <nav className="mt-6 grid gap-1" aria-label="Categories">
            <Link href="/shop" onClick={() => setOpen(false)} className="flex items-center justify-between rounded-md px-3 py-3 font-medium hover:bg-accent">
              Shop all <ArrowUpRight className="size-4" />
            </Link>
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/shop?category=${c.slug}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-3 text-[15px] hover:bg-accent"
              >
                <CategoryIcon category={c.slug} className="size-5" />
                {c.long}
              </Link>
            ))}
            <Link href="/track" onClick={() => setOpen(false)} className="mt-2 flex items-center justify-between rounded-md border px-3 py-3 text-[15px] hover:bg-accent">
              Track your order <ArrowUpRight className="size-4" />
            </Link>
          </nav>
        </div>
        <div className="border-t p-5 text-sm text-muted-foreground">
          <p>{store.contact.hours}</p>
          <a href={`https://wa.me/${store.contact.whatsapp}`} className="mt-1 block font-medium text-ink">
            WhatsApp {store.contact.phone}
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
