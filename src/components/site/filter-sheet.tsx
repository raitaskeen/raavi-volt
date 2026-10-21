"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

/** Mobile wrapper for the (server-rendered) filter panel. Closes itself when the URL changes. */
export function FilterSheet({ count, active, children }: { count: number; active: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const params = useSearchParams();
  useEffect(() => setOpen(false), [pathname, params]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="shrink-0 rounded-full lg:hidden">
          <SlidersHorizontal /> Filters
          {active > 0 && <span className="grid size-5 place-items-center rounded-full bg-volt text-[10px] font-semibold text-ink">{active}</span>}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>{count} products match</SheetDescription>
        </SheetHeader>
        <div className="overflow-y-auto p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
