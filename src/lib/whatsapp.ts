import { after } from "next/server";
import { cfEnv, db } from "@/lib/cf";
import { whatsappConfig } from "@/config/store";
import { cleanParam, renderTemplate, templates, type TemplateKey } from "@/lib/whatsapp-templates";

const GRAPH_API = "https://graph.facebook.com/v23.0";

/** 03001234567 → 923001234567. Already-international digits pass through. */
export function toIntl(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("92")) return digits;
  if (digits.startsWith("0")) return `92${digits.slice(1)}`;
  return digits;
}

/** wa.me link with the rendered message, for manual sending from the admin. */
export function manualLink(to: string, text: string) {
  return `https://wa.me/${toIntl(to)}?text=${encodeURIComponent(text)}`;
}

export function whatsappConfigured() {
  const env = cfEnv();
  return Boolean(env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID);
}

type SendInput = {
  to: string;
  template: TemplateKey;
  params: string[];
  orderCode?: string;
  messageId?: string;
};

export type SendResult = { status: "sent" | "failed" | "skipped"; error?: string };

/** Sends one approved template via the WhatsApp Cloud API and records the attempt. */
export async function sendTemplateNow({ to, template, params, orderCode, messageId }: SendInput): Promise<SendResult> {
  const env = cfEnv();
  const def = templates[template];
  const recipient = toIntl(to);
  const body = renderTemplate(template, params);
  let result: SendResult;
  let providerId: string | null = null;

  if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    result = { status: "skipped", error: "WhatsApp API not configured" };
  } else {
    try {
      const res = await fetch(`${env.WHATSAPP_API_BASE || GRAPH_API}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipient,
          type: "template",
          template: {
            name: def.name,
            language: { code: whatsappConfig.language },
            components: [{ type: "body", parameters: params.map((p) => ({ type: "text", text: cleanParam(p) })) }],
          },
        }),
        signal: AbortSignal.timeout(10_000),
      });
      const data = (await res.json().catch(() => ({}))) as { messages?: { id: string }[]; error?: { message?: string; code?: number } };
      if (res.ok) {
        providerId = data.messages?.[0]?.id ?? null;
        result = { status: "sent" };
      } else {
        result = { status: "failed", error: `${data.error?.code ?? res.status}: ${data.error?.message ?? res.statusText}` };
      }
    } catch (err) {
      result = { status: "failed", error: err instanceof Error ? err.message : String(err) };
    }
  }

  await db()
    .prepare(
      `INSERT INTO notifications (id, order_code, message_id, recipient, audience, template, body, status, provider_id, error)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(crypto.randomUUID(), orderCode ?? null, messageId ?? null, recipient, def.audience, template, body, result.status, providerId, result.error ?? null)
    .run()
    .catch((e) => console.error("notification log failed", e));

  if (result.status === "failed") console.error(`WhatsApp ${def.name} → ${recipient} failed: ${result.error}`);
  return result;
}

/**
 * Queues a send to run after the response is streamed (Workers `waitUntil` via
 * Next's `after`), so customers never wait on Meta's API.
 */
export function sendTemplate(input: SendInput) {
  after(() => sendTemplateNow(input).then(() => undefined));
}

export type NotificationRow = {
  id: string;
  recipient: string;
  audience: "customer" | "admin";
  template: TemplateKey;
  body: string;
  status: "sent" | "failed" | "skipped";
  error: string | null;
  created_at: number;
};

export async function listNotifications(filter: { orderCode?: string; messageId?: string; limit?: number }) {
  const [col, val] = filter.orderCode ? ["order_code", filter.orderCode] : ["message_id", filter.messageId ?? ""];
  const { results } = await db()
    .prepare(`SELECT id, recipient, audience, template, body, status, error, created_at FROM notifications WHERE ${col} = ? ORDER BY created_at DESC LIMIT ?`)
    .bind(val, filter.limit ?? 20)
    .all<NotificationRow>();
  return results;
}
