import { cn, discountPercent, formatPKR } from "@/lib/utils";

export function Price({
  price,
  compareAt,
  size = "md",
  className,
}: {
  price: number;
  compareAt?: number | null;
  size?: "md" | "lg";
  className?: string;
}) {
  const off = discountPercent(price, compareAt);
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span className={cn("font-semibold tabular-nums", size === "lg" ? "text-2xl sm:text-3xl" : "text-[15px]")}>
        {formatPKR(price)}
      </span>
      {off > 0 && (
        <>
          <s className={cn("text-muted-foreground tabular-nums", size === "lg" ? "text-base" : "text-xs")}>
            {formatPKR(compareAt!)}
          </s>
          <span className={cn("rounded-full bg-flame px-2 py-0.5 font-mono font-semibold text-white", size === "lg" ? "text-xs" : "text-[10px]")}>
            −{off}%
          </span>
          {size === "lg" && <span className="basis-full text-sm font-semibold text-flame">You save {formatPKR(compareAt! - price)}</span>}
        </>
      )}
    </div>
  );
}
