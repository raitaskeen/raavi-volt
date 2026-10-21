"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import { sortOptions } from "@/lib/sort";

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  return (
    <label className="relative flex shrink-0 items-center">
      <span className="sr-only">Sort products</span>
      <ArrowUpDown className="pointer-events-none absolute left-2.5 size-3.5 text-muted-foreground" />
      <select
        value={value}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams);
          if (e.target.value === "featured") params.delete("sort");
          else params.set("sort", e.target.value);
          params.delete("page");
          startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }));
        }}
        data-pending={pending || undefined}
        className="h-8 appearance-none rounded-full border bg-card pr-3 pl-8 text-xs font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 data-[pending]:opacity-60"
      >
        {sortOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
