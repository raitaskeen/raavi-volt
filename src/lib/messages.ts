import { db } from "@/lib/cf";
import { notifyAdmin } from "@/lib/notifications";
import { notify } from "@/lib/whatsapp";

export type MessageStatus = "new" | "replied" | "closed";

export type ContactMessage = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  topic: string;
  orderCode: string | null;
  body: string;
  whatsappOptIn: boolean;
  status: MessageStatus;
  createdAt: number;
};

type Row = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  topic: string;
  order_code: string | null;
  body: string;
  whatsapp_opt_in: number;
  status: MessageStatus;
  created_at: number;
};

const toMessage = (r: Row): ContactMessage => ({
  id: r.id,
  name: r.name,
  phone: r.phone,
  email: r.email,
  topic: r.topic,
  orderCode: r.order_code,
  body: r.body,
  whatsappOptIn: r.whatsapp_opt_in === 1,
  status: r.status,
  createdAt: r.created_at,
});

export type NewMessage = Omit<ContactMessage, "id" | "status" | "createdAt">;

/** Saves a contact message, acknowledges the customer and alerts the store on WhatsApp. */
export async function createMessage(input: NewMessage) {
  const id = crypto.randomUUID();
  await db()
    .prepare("INSERT INTO messages (id, name, phone, email, topic, order_code, body, whatsapp_opt_in) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(id, input.name, input.phone, input.email, input.topic, input.orderCode, input.body, input.whatsappOptIn ? 1 : 0)
    .run();

  if (input.whatsappOptIn) {
    notify({ to: input.phone, template: "contactReceived", params: [input.name.split(" ")[0] ?? input.name, input.topic.toLowerCase()], messageId: id });
  }
  const preview = input.body.length > 120 ? `${input.body.slice(0, 117)}...` : input.body;
  notifyAdmin(`New message: ${input.topic}`, `${input.name} (${input.phone})${input.orderCode ? ` re ${input.orderCode}` : ""}: ${preview}`, `/messages/${id}`, {
    messageId: id,
  });
  return id;
}

export async function listMessages({ status }: { status?: MessageStatus } = {}) {
  const where = status ? "WHERE status = ?" : "";
  const { results } = await db()
    .prepare(`SELECT * FROM messages ${where} ORDER BY created_at DESC LIMIT 100`)
    .bind(...(status ? [status] : []))
    .all<Row>();
  return results.map(toMessage);
}

export async function getMessage(id: string) {
  const row = await db().prepare("SELECT * FROM messages WHERE id = ?").bind(id).first<Row>();
  return row ? toMessage(row) : null;
}

export async function setMessageStatus(id: string, status: MessageStatus) {
  await db().prepare("UPDATE messages SET status = ?, updated_at = unixepoch() WHERE id = ?").bind(status, id).run();
}

export async function countNewMessages() {
  const row = await db().prepare("SELECT COUNT(*) AS n FROM messages WHERE status = 'new'").first<{ n: number }>();
  return row?.n ?? 0;
}
