import Link from "next/link";
import { Inbox } from "lucide-react";
import { PageHeader, messageTone as statusTone } from "@/components/admin/ui";
import { listMessages, type MessageStatus } from "@/lib/messages";
import { cn, formatDate } from "@/lib/utils";

export const metadata = { title: "Messages" };

const filters: { value?: MessageStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "replied", label: "Replied" },
  { value: "closed", label: "Closed" },
  { value: undefined, label: "All" },
];

export default async function AdminMessages({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const status = (["new", "replied", "closed"] as const).find((s) => s === (sp.status ?? "new"));
  const items = await listMessages({ status: sp.status === "all" ? undefined : status });

  return (
    <>
      <PageHeader title="Messages" description="Contact form inbox. Replies go out from your WhatsApp." />
      <nav aria-label="Filter messages" className="mb-4 flex gap-2">
        {filters.map((f) => {
          const value = f.value ?? "all";
          const active = (sp.status ?? "new") === value;
          return (
            <Link
              key={value}
              href={`/admin/messages?status=${value}`}
              className={cn("rounded-full border px-3.5 py-1.5 text-xs font-medium", active ? "border-ink bg-ink text-white" : "bg-card hover:border-charcoal/40")}
            >
              {f.label}
            </Link>
          );
        })}
      </nav>
      {items.length === 0 ? (
        <div className="grid place-items-center gap-3 rounded-xl border border-dashed bg-card p-12 text-center text-sm text-muted-foreground">
          <Inbox className="size-8" strokeWidth={1.25} />
          No messages here.
        </div>
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {items.map((m) => (
            <li key={m.id}>
              <Link href={`/admin/messages/${m.id}`} className="grid gap-1 px-5 py-4 hover:bg-paper sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium capitalize", statusTone[m.status])}>{m.status}</span>
                    <span className="font-medium">{m.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {m.topic}
                      {m.orderCode && ` · ${m.orderCode}`}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-charcoal">{m.body}</p>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(m.createdAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
