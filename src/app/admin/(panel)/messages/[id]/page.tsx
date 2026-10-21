import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, messageTone as statusTone } from "@/components/admin/ui";
import { WhatsAppIcon } from "@/components/site/icons";
import { updateMessageStatus } from "@/app/admin/(panel)/messages/actions";
import { getMessage } from "@/lib/messages";
import { listNotifications, manualLink } from "@/lib/whatsapp";
import { store } from "@/config/store";
import { cn, formatDate } from "@/lib/utils";

export const metadata = { title: "Message" };

export default async function AdminMessage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const message = await getMessage(id);
  if (!message) notFound();
  const log = await listNotifications({ messageId: id });
  const reply = `Assalam o Alaikum ${message.name.split(" ")[0]}, this is ${store.name} replying to your message about ${message.topic.toLowerCase()}. `;

  return (
    <>
      <Link href="/admin/messages" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink">
        <ArrowLeft className="size-4" /> Inbox
      </Link>
      <PageHeader title={message.topic} description={`From ${message.name} · ${formatDate(message.createdAt)}`}>
        <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize", statusTone[message.status])}>{message.status}</span>
      </PageHeader>

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_340px]">
        <section className="grid gap-4 rounded-xl border bg-card p-5 sm:p-6">
          <p className="text-[15px] leading-relaxed whitespace-pre-line">{message.body}</p>
          {message.orderCode && (
            <Link href={`/admin/orders/${message.orderCode}`} className="w-fit rounded-md bg-paper px-3 py-1.5 font-mono text-sm hover:underline">
              Order {message.orderCode} →
            </Link>
          )}
          {log.length > 0 && (
            <ol className="grid gap-1.5 border-t pt-4 text-xs text-muted-foreground">
              {log.map((n) => (
                <li key={n.id}>
                  WhatsApp {n.template === "adminAlert" ? "alert to you" : "acknowledgement to customer"}: <strong className="text-ink">{n.status}</strong>
                  {n.error ? ` — ${n.error}` : ""} · {formatDate(n.created_at)}
                </li>
              ))}
            </ol>
          )}
        </section>

        <aside className="grid gap-4 rounded-xl border bg-card p-5">
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Phone</dt>
              <dd>{message.phone}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="truncate">{message.email ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Reply on WhatsApp</dt>
              <dd>{message.whatsappOptIn ? "Yes" : "No"}</dd>
            </div>
          </dl>
          <Button asChild className="bg-[#1da851] hover:bg-[#178a43]">
            <a href={manualLink(message.phone, reply)} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon /> Reply on WhatsApp
            </a>
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={`tel:${message.phone}`}>
                <Phone /> Call
              </a>
            </Button>
            <Button asChild variant="outline" size="sm" disabled={!message.email}>
              <a href={message.email ? `mailto:${message.email}` : undefined}>
                <Mail /> Email
              </a>
            </Button>
          </div>
          <form action={updateMessageStatus.bind(null, message.id)} className="grid grid-cols-2 gap-2 border-t pt-4">
            {message.status !== "replied" && (
              <Button type="submit" name="status" value="replied">
                Mark replied
              </Button>
            )}
            {message.status !== "closed" && (
              <Button type="submit" name="status" value="closed" variant="outline">
                Close
              </Button>
            )}
            {message.status !== "new" && (
              <Button type="submit" name="status" value="new" variant="ghost">
                Reopen
              </Button>
            )}
          </form>
        </aside>
      </div>
    </>
  );
}
