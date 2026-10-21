import { after } from "next/server";
import { cfEnv, db } from "@/lib/cf";
import { whatsappConfig } from "@/config/store";
import { cleanParam, renderTemplate, templates, type TemplateKey } from "@/lib/whatsapp-templates";

const GRAPH_API = "https://graph.facebook.com/v23.0";
/** WhatsApp lets you reply freely for 24 h after the customer's last message; keep a small margin. */
const WINDOW_SECONDS = 24 * 3600 - 300;

/** 03001234567 → 923001234567. Already-international digits pass through. */
export function toIntl(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("92")) return digits;
  if (digits.startsWith("0")) return `92${digits.slice(1)}`;
  return digits;
}

/** 923001234567 → 03001234567 (how phones are stored on orders). */
export function toLocal(waId: string) {
  return waId.startsWith("92") ? `0${waId.slice(2)}` : waId;
}

/** wa.me link with a prefilled message. */
export function manualLink(to: string, text: string) {
  return `https://wa.me/${toIntl(to)}?text=${encodeURIComponent(text)}`;
}

export function whatsappConfigured() {
  const env = cfEnv();
  return Boolean(env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID);
}

/** Owner’s personal WhatsApp for alerts + commands: secret WHATSAPP_ADMIN_NUMBER, else config. */
export function adminNumber() {
  const n = cfEnv().WHATSAPP_ADMIN_NUMBER || whatsappConfig.adminNumber;
  return n ? toIntl(n) : "";
}

function apiBase() {
  return cfEnv().WHATSAPP_API_BASE || GRAPH_API;
}

/* ------------------------------ 24 h window ------------------------------ */

export async function windowExpiresAt(waId: string) {
  const row = await db().prepare("SELECT last_inbound_at FROM wa_contacts WHERE wa_id = ?").bind(waId).first<{ last_inbound_at: number }>();
  return row ? row.last_inbound_at + WINDOW_SECONDS : null;
}

export async function isWindowOpen(waId: string) {
  const exp = await windowExpiresAt(waId);
  return exp !== null && exp > Date.now() / 1000;
}

/* ------------------------------ Graph API -------------------------------- */

export type Button = { id: string; title: string };
type Payload =
  | { type: "template"; template: TemplateKey; params: string[] }
  | { type: "text"; body: string; buttons?: Button[] }
  | { type: "image"; link: string; caption?: string };

function toGraph(to: string, p: Payload) {
  const base = { messaging_product: "whatsapp", recipient_type: "individual", to };
  if (p.type === "template") {
    return {
      ...base,
      type: "template",
      template: {
        name: templates[p.template].name,
        language: { code: whatsappConfig.language },
        components: [{ type: "body", parameters: p.params.map((t) => ({ type: "text", text: cleanParam(t) })) }],
      },
    };
  }
  if (p.type === "image") return { ...base, type: "image", image: { link: p.link, caption: p.caption?.slice(0, 1024) } };
  if (p.buttons?.length) {
    return {
      ...base,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: p.body.slice(0, 1024) },
        action: { buttons: p.buttons.slice(0, 3).map((b) => ({ type: "reply", reply: { id: b.id, title: b.title.slice(0, 20) } })) },
      },
    };
  }
  return { ...base, type: "text", text: { body: p.body.slice(0, 4096), preview_url: true } };
}

async function graphSend(to: string, p: Payload): Promise<{ ok: true; id: string | null } | { ok: false; error: string }> {
  const env = cfEnv();
  try {
    const res = await fetch(`${apiBase()}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(toGraph(to, p)),
      signal: AbortSignal.timeout(10_000),
    });
    const data = (await res.json().catch(() => ({}))) as { messages?: { id: string }[]; error?: { message?: string; code?: number } };
    if (res.ok) return { ok: true, id: data.messages?.[0]?.id ?? null };
    return { ok: false, error: `${data.error?.code ?? res.status}: ${data.error?.message ?? res.statusText}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Downloads inbound media (e.g. a payment screenshot). */
export async function downloadMedia(mediaId: string) {
  const token = cfEnv().WHATSAPP_TOKEN;
  const meta = await fetch(`${apiBase()}/${mediaId}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!meta.ok) throw new Error(`media lookup ${meta.status}`);
  const { url, mime_type } = (await meta.json()) as { url: string; mime_type: string };
  const file = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!file.ok) throw new Error(`media download ${file.status}`);
  return { bytes: await file.arrayBuffer(), mimeType: mime_type };
}

/* ------------------------------ logged sends ----------------------------- */

export type SendResult = { status: "sent" | "failed" | "skipped"; error?: string };
type Ref = { orderCode?: string; messageId?: string };

async function logSend(recipient: string, audience: "customer" | "admin", template: string, kind: string, body: string, result: SendResult, providerId: string | null, ref: Ref) {
  await db()
    .prepare(
      `INSERT INTO notifications (id, order_code, message_id, recipient, audience, template, kind, body, status, provider_id, error, delivery)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(crypto.randomUUID(), ref.orderCode ?? null, ref.messageId ?? null, recipient, audience, template, kind, body, result.status, providerId, result.error ?? null, result.status === "sent" ? "sent" : null)
    .run()
    .catch((e) => console.error("notification log failed", e));
  if (result.status === "failed") console.error(`WhatsApp ${template} → ${recipient} failed: ${result.error}`);
}

type NotifyInput = Ref & {
  to: string;
  template: TemplateKey;
  params: string[];
  /** Quick-reply buttons added when sent as a free in-window message. */
  buttons?: Button[];
  /** Ignore the outsideWindow policy and always send the template (e.g. admin resend). */
  forceTemplate?: boolean;
};

/**
 * Sends a notification the cheapest allowed way:
 * - customer messaged in the last 24 h → free-form text (free), with buttons
 * - otherwise → approved template if `outsideWindow` is "template", else skipped (manual send)
 */
export async function notifyNow(input: NotifyInput): Promise<SendResult> {
  const def = templates[input.template];
  const recipient = toIntl(input.to);
  const body = renderTemplate(input.template, input.params);

  if (!whatsappConfigured()) {
    const result: SendResult = { status: "skipped", error: "WhatsApp API not connected" };
    await logSend(recipient, def.audience, input.template, "template", body, result, null, input);
    return result;
  }

  const open = await isWindowOpen(recipient);
  if (open && !input.forceTemplate) {
    const res = await graphSend(recipient, { type: "text", body, buttons: input.buttons });
    const result: SendResult = res.ok ? { status: "sent" } : { status: "failed", error: res.error };
    await logSend(recipient, def.audience, input.template, "text", body, result, res.ok ? res.id : null, input);
    return result;
  }

  if (whatsappConfig.outsideWindow === "template" || input.forceTemplate) {
    const res = await graphSend(recipient, { type: "template", template: input.template, params: input.params });
    const result: SendResult = res.ok ? { status: "sent" } : { status: "failed", error: res.error };
    await logSend(recipient, def.audience, input.template, "template", body, result, res.ok ? res.id : null, input);
    return result;
  }

  const result: SendResult = { status: "skipped", error: "Outside the free 24h chat window — send manually or reply when the customer writes" };
  await logSend(recipient, def.audience, input.template, "template", body, result, null, input);
  return result;
}

/** Queues `notifyNow` after the response (Workers waitUntil via Next's `after`). */
export function notify(input: NotifyInput) {
  after(() => notifyNow(input).then(() => undefined));
}

/** Free-form reply inside an open window (bot replies). Logged like notifications. */
export async function reply(to: string, body: string, opts: Ref & { buttons?: Button[]; imageLink?: string } = {}) {
  const recipient = toIntl(to);
  if (!whatsappConfigured()) return;
  if (opts.imageLink) {
    await graphSend(recipient, { type: "image", link: opts.imageLink });
  }
  const res = await graphSend(recipient, { type: "text", body, buttons: opts.buttons });
  await logSend(recipient, "customer", "botReply", "text", body, res.ok ? { status: "sent" } : { status: "failed", error: res.error }, res.ok ? res.id : null, opts);
}

/** Delivery receipts from the webhook. */
export async function recordDelivery(providerId: string, status: string, error?: string) {
  await db()
    .prepare("UPDATE notifications SET delivery = ?, error = COALESCE(?, error) WHERE provider_id = ?")
    .bind(status, error ?? null, providerId)
    .run();
}

/* ------------------------------ admin views ------------------------------ */

export type NotificationRow = {
  id: string;
  recipient: string;
  audience: "customer" | "admin";
  template: string;
  kind: "template" | "text";
  body: string;
  status: "sent" | "failed" | "skipped";
  delivery: string | null;
  error: string | null;
  created_at: number;
};

export async function listNotifications(filter: { orderCode?: string; messageId?: string; limit?: number }) {
  const [col, val] = filter.orderCode ? ["order_code", filter.orderCode] : ["message_id", filter.messageId ?? ""];
  const { results } = await db()
    .prepare(`SELECT id, recipient, audience, template, kind, body, status, delivery, error, created_at FROM notifications WHERE ${col} = ? ORDER BY created_at DESC LIMIT ?`)
    .bind(val, filter.limit ?? 30)
    .all<NotificationRow>();
  return results;
}

export async function listInbound(orderCode: string, limit = 20) {
  const { results } = await db()
    .prepare("SELECT id, type, text, created_at FROM wa_inbound WHERE order_code = ? ORDER BY created_at DESC LIMIT ?")
    .bind(orderCode, limit)
    .all<{ id: string; type: string; text: string | null; created_at: number }>();
  return results;
}
