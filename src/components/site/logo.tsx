import { cn } from "@/lib/utils";

/** Wordmark: a river-wave bolt (Raavi = the Ravi river of Lahore) + name. */
export function Logo({ className, inverse }: { className?: string; inverse?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg viewBox="0 0 32 32" className="size-7 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="7" className={inverse ? "fill-white" : "fill-matte"} />
        <path d="M18.5 5 9 18h6.2l-1.7 9L23 14h-6.3l1.8-9Z" className={inverse ? "fill-ink" : "fill-volt"} />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-bold tracking-[-0.02em]">RAAVI VOLT</span>
        <span className={cn("font-mono text-[9px] tracking-[0.22em]", inverse ? "text-white/55" : "text-muted-foreground")}>
          LAHORE · EST. 2026
        </span>
      </span>
    </span>
  );
}
