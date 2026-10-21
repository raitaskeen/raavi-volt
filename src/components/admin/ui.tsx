import { cn } from "@/lib/utils";
import { statusLabel } from "@/config/store";

export function PageHeader({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, highlight }: { label: string; value: string | number; hint?: string; highlight?: boolean }) {
  return (
    <div className={cn("rounded-xl border p-5", highlight ? "border-ink bg-volt" : "bg-card")}>
      <p className="eyebrow text-muted-foreground">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const statusTone: Record<string, string> = {
  awaiting_payment: "border border-border bg-card text-muted-foreground",
  payment_submitted: "bg-volt text-ink ring-1 ring-ink",
  confirmed: "border border-ink bg-card text-ink",
  shipped: "bg-charcoal text-white",
  delivered: "bg-secondary text-ink",
  cancelled: "border border-dashed border-border text-muted-foreground line-through",
};

export const messageTone = {
  new: "bg-volt text-ink ring-1 ring-ink",
  replied: "border bg-card text-ink",
  closed: "bg-muted text-muted-foreground",
} as const;

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap", statusTone[status])}>
      {statusLabel(status)}
    </span>
  );
}

export function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3 [&_th]:font-mono [&_th]:text-[11px] [&_th]:font-medium [&_th]:tracking-wider [&_th]:text-muted-foreground [&_th]:uppercase [&_thead]:border-b [&_thead]:bg-paper [&_tbody_tr]:border-b [&_tbody_tr:last-child]:border-0 [&_tbody_tr:hover]:bg-paper/60">
          {children}
        </table>
      </div>
    </div>
  );
}
