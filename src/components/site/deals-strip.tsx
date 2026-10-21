import Link from "next/link";
import { Zap } from "lucide-react";
import { shipping } from "@/config/store";
import { listDeals } from "@/lib/products";
import { discountPercent, formatPKR } from "@/lib/utils";

type Item = { key: string; href?: string; content: React.ReactNode };

/** Volt announcement strip: live discounts from D1, scrolling. Pure CSS, pauses on hover. */
export async function DealsStrip() {
  const deals = await listDeals(6).catch(() => []);
  const items: Item[] = [
    { key: "free", content: <>Free delivery in Lahore over {formatPKR(shipping.freeOver)}</> },
    ...deals.map((d) => ({
      key: d.id,
      href: `/product/${d.slug}`,
      content: (
        <>
          <span className="rounded bg-ink px-1.5 py-px font-semibold text-volt">−{discountPercent(d.price, d.compareAt)}%</span>
          {d.name} — <span className="font-semibold">{formatPKR(d.price)}</span>
        </>
      ),
    })),
    { key: "pay", content: <>Pay instantly with Raast QR · JazzCash · Easypaisa</> },
    { key: "warranty", content: <>100% genuine · brand warranty</> },
  ];

  const row = (hidden: boolean) =>
    items.map((it) => {
      const inner = (
        <span className="flex items-center gap-2 whitespace-nowrap">
          <Zap className="size-3.5 fill-ink" aria-hidden />
          {it.content}
        </span>
      );
      return it.href ? (
        <Link key={`${hidden}-${it.key}`} href={it.href} tabIndex={hidden ? -1 : undefined} className="hover:underline">
          {inner}
        </Link>
      ) : (
        <span key={`${hidden}-${it.key}`}>{inner}</span>
      );
    });

  return (
    <div className="group relative overflow-hidden bg-volt text-ink">
      <div className="flex h-9 w-max animate-marquee-fast items-center gap-10 pr-10 font-mono text-[11.5px] font-medium group-hover:[animation-play-state:paused]">
        <div className="flex items-center gap-10">{row(false)}</div>
        <div className="flex items-center gap-10" aria-hidden>
          {row(true)}
        </div>
      </div>
    </div>
  );
}
