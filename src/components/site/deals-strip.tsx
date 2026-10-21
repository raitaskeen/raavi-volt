import Link from "next/link";
import { BadgeCheck, QrCode, Truck, Zap } from "lucide-react";
import { shipping, store } from "@/config/store";
import { listDeals } from "@/lib/products";
import { discountPercent, formatPKR } from "@/lib/utils";

type Item = { key: string; href?: string; icon: React.ReactNode; content: React.ReactNode };

/** Seconds per item — keeps a calm, readable speed whatever the number of deals. */
const SECONDS_PER_ITEM = 7;

/**
 * Volt announcement strip with live discounts from D1. Pure CSS ticker:
 * two identical halves translate by exactly -50% on the GPU, so the loop is
 * seamless. Pauses on hover / focus; static and swipeable with reduced motion.
 */
export async function DealsStrip() {
  const deals = await listDeals(6).catch(() => []);
  const items: Item[] = [
    {
      key: "free",
      icon: <Truck className="size-4" strokeWidth={2} />,
      content: (
        <>
          Free delivery in Lahore over <strong className="font-semibold">{formatPKR(shipping.freeOver)}</strong>
        </>
      ),
    },
    ...deals.map((d) => ({
      key: d.id,
      href: `/product/${d.slug}`,
      icon: <Zap className="size-4 fill-ink" strokeWidth={2} />,
      content: (
        <>
          <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] leading-none font-bold text-volt tabular-nums">−{discountPercent(d.price, d.compareAt)}%</span>
          <span>{d.name}</span>
          <strong className="font-semibold tabular-nums">{formatPKR(d.price)}</strong>
        </>
      ),
    })),
    {
      key: "pay",
      icon: <QrCode className="size-4" strokeWidth={2} />,
      content: <>Pay in seconds with Raast QR, JazzCash or Easypaisa</>,
    },
    {
      key: "dealer",
      icon: <BadgeCheck className="size-4" strokeWidth={2} />,
      content: <>Authorised {store.authorisedDealerOf} dealer · official warranty</>,
    },
  ];

  const duration = `${items.length * SECONDS_PER_ITEM}s`;

  const half = (copy: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={copy || undefined}>
      {items.map((it) => {
        const inner = (
          <span className="flex items-center gap-2 whitespace-nowrap">
            {it.icon}
            {it.content}
          </span>
        );
        return (
          <li key={it.key} className="flex items-center">
            {it.href ? (
              <Link href={it.href} tabIndex={copy ? -1 : undefined} className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ink">
                {inner}
              </Link>
            ) : (
              inner
            )}
            <span className="mx-6 size-1 rounded-full bg-ink/35 sm:mx-8" aria-hidden />
          </li>
        );
      })}
    </ul>
  );

  return (
    <div
      role="region"
      aria-label="Offers"
      className="group relative overflow-hidden bg-volt text-ink [mask-image:linear-gradient(to_right,transparent,black_24px,black_calc(100%-24px),transparent)] motion-reduce:overflow-x-auto motion-reduce:[mask-image:none]"
    >
      <div
        className="ticker flex h-10 w-max items-center text-[13px] font-medium sm:text-sm group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]"
        style={{ "--ticker-duration": duration } as React.CSSProperties}
      >
        {half(false)}
        {half(true)}
      </div>
    </div>
  );
}
