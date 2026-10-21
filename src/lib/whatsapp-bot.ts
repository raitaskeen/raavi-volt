/**
 * WhatsApp assistant: handles everything customers and the owner send to the
 * store number. Replies are free because the customer just messaged us (that
 * opens WhatsApp's 24-hour customer-service window).
 */
import { db } from "@/lib/cf";
import { putFile } from "@/lib/storage";
import { extensionFor, sniffFileType } from "@/lib/file-type";
import { couriers, paymentAccounts, statusLabel, store, type OrderStatus } from "@/config/store";
import {
  getOrderByCode,
  latestActiveOrderByPhone,
  pendingOrders,
  submitPayment,
  updateOrderStatus,
  type Order,
} from "@/lib/orders";
import { notifyAdmin, orderButtons, orderStageText } from "@/lib/notifications";
import { adminNumber, downloadMedia, recordDelivery, reply, toLocal } from "@/lib/whatsapp";

/* ------------------------------ webhook types ----------------------------- */

type InboundMessage = {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  image?: { id: string; mime_type?: string; caption?: string };
  document?: { id: string; mime_type?: string; caption?: string; filename?: string };
  interactive?: { type: string; button_reply?: { id: string; title: string }; list_reply?: { id: string; title: string } };
  button?: { payload?: string; text?: string };
};

type StatusUpdate = { id: string; status: string; errors?: { title?: string; message?: string }[] };

export type WebhookPayload = {
  object?: string;
  entry?: {
    changes?: {
      field?: string;
      value?: {
        contacts?: { wa_id: string; profile?: { name?: string } }[];
        messages?: InboundMessage[];
        statuses?: StatusUpdate[];
      };
    }[];
  }[];
};

export async function handleWebhook(payload: WebhookPayload) {
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value) continue;
      for (const s of value.statuses ?? []) {
        await recordDelivery(s.id, s.status, s.errors?.[0]?.message ?? s.errors?.[0]?.title).catch((e) => console.error("receipt", e));
      }
      for (const m of value.messages ?? []) {
        const name = value.contacts?.find((c) => c.wa_id === m.from)?.profile?.name ?? null;
        await handleMessage(m, name).catch((e) => console.error("inbound", e));
      }
    }
  }
}

/* -------------------------------- helpers -------------------------------- */

const CODE_RE = /\bRV[-\s]?([A-Z0-9]{10})\b/i;
const TID_RE = /\b(?:tid|trx|txn|ref|transaction(?:\s*id)?|tran(?:saction)?\s*no)\s*[:#.\-]?\s*([A-Z0-9]{6,32})\b/i;
const HUMAN_RE = /\b(human|agent|person|representative|call me|talk to|baat)\b/i;
const pkr = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 });
const now = () => Math.floor(Date.now() / 1000);

function messageText(m: InboundMessage) {
  return (m.text?.body ?? m.image?.caption ?? m.document?.caption ?? m.interactive?.button_reply?.title ?? m.button?.text ?? "").trim();
}

function buttonId(m: InboundMessage) {
  return m.interactive?.button_reply?.id ?? m.interactive?.list_reply?.id ?? m.button?.payload ?? null;
}

function normaliseCode(raw: string) {
  const m = raw.toUpperCase().match(/^(?:RV-?)?([A-Z0-9]{10})$/);
  return m ? `RV-${m[1]}` : null;
}

function paymentInstructions(order: Order) {
  const chosen = paymentAccounts.find((a) => a.id === order.paymentAccount) ?? paymentAccounts[0];
  const others = paymentAccounts.filter((a) => a.id !== chosen.id);
  const line = (a: (typeof paymentAccounts)[number]) => `• ${a.bank} — ${a.accountTitle}\n  ${a.iban ?? a.accountNumber}`;
  return [
    `To pay *Rs ${pkr.format(order.total)}* for order *${order.code}*:`,
    line(chosen),
    others.length ? `\nOr any of:\n${others.map(line).join("\n")}` : "",
    `\nThen send the *payment screenshot here* (or type: TID 123456789). That's it — we'll confirm right away.`,
  ]
    .filter(Boolean)
    .join("\n");
}


/* ----------------------------- inbound message ---------------------------- */

async function handleMessage(m: InboundMessage, profileName: string | null) {
  const waId = m.from;
  const text = messageText(m);
  const mediaId = m.image?.id ?? m.document?.id ?? null;
  const d = db();

  // Webhooks are retried — the wamid primary key makes processing idempotent.
  const inserted = await d
    .prepare("INSERT OR IGNORE INTO wa_inbound (id, wa_id, type, text, media_id) VALUES (?, ?, ?, ?, ?)")
    .bind(m.id, waId, m.type, text || null, mediaId)
    .run();
  if (inserted.meta.changes === 0) return;

  // Any message opens / refreshes the free 24 h reply window.
  const ts = Number(m.timestamp) || now();
  await d
    .prepare(
      `INSERT INTO wa_contacts (wa_id, name, last_inbound_at) VALUES (?, ?, ?)
       ON CONFLICT(wa_id) DO UPDATE SET name = COALESCE(excluded.name, name), last_inbound_at = MAX(last_inbound_at, excluded.last_inbound_at), updated_at = unixepoch()`,
    )
    .bind(waId, profileName, ts)
    .run();

  if (adminNumber() && waId === adminNumber()) {
    await handleOwnerCommand(waId, text);
    return;
  }

  const contact = await d
    .prepare("SELECT bot_paused_until, last_bot_reply_at FROM wa_contacts WHERE wa_id = ?")
    .bind(waId)
    .first<{ bot_paused_until: number | null; last_bot_reply_at: number | null }>();
  const btn = buttonId(m);

  // Which order is this about? An explicit code wins, else their latest active order.
  const codeFromText = text.match(CODE_RE)?.[1];
  const codeFromButton = btn?.includes(":") ? btn.split(":")[1] : undefined;
  const code = normaliseCode(codeFromText ?? codeFromButton ?? "");
  const order = code ? await getOrderByCode(code) : await latestActiveOrderByPhone(toLocal(waId));
  if (order) await d.prepare("UPDATE wa_inbound SET order_code = ? WHERE id = ?").bind(order.code, m.id).run();

  const markReplied = () => d.prepare("UPDATE wa_contacts SET last_bot_reply_at = ? WHERE wa_id = ?").bind(now(), waId).run();
  const ref = { orderCode: order?.code };

  // 1. Hand over to a person.
  if (btn === "human" || HUMAN_RE.test(text)) {
    await d.prepare("UPDATE wa_contacts SET bot_paused_until = ? WHERE wa_id = ?").bind(now() + 12 * 3600, waId).run();
    notifyAdmin(`Customer wants to talk`, `${profileName ?? waId} (${toLocal(waId)})${order ? ` about ${order.code}` : ""}: ${text || "[button]"}`, order ? `/orders/${order.code}` : "/messages", ref);
    await reply(waId, `Sure — a member of the ${store.name} team will reply here shortly (${store.contact.hours}).`, ref);
    await markReplied();
    return;
  }

  // While a person is handling the chat, the assistant stays quiet.
  if (contact?.bot_paused_until && contact.bot_paused_until > now()) return;

  const awaitingPayment = order && (order.status === "awaiting_payment" || order.status === "payment_submitted");

  // 2. Payment screenshot → attach it to the order.
  if (mediaId) {
    if (!order || !awaitingPayment) {
      await reply(waId, `Thanks! Which order is this for? Please send your order number (it looks like RV-7K3M9QXA2T).`, ref);
      await markReplied();
      return;
    }
    const file = await downloadMedia(mediaId);
    const type = sniffFileType(file.bytes);
    if (!type || file.bytes.byteLength > 8 * 1024 * 1024) {
      await reply(waId, `Sorry, I couldn't read that file. Please send the payment screenshot as a photo (JPG/PNG) or a PDF under 8 MB.`, ref);
      await markReplied();
      return;
    }
    const key = `proofs/${order.code}/${crypto.randomUUID()}.${extensionFor[type]}`;
    await putFile(key, file.bytes, type);
    const tid = text.match(TID_RE)?.[1] ?? order.paymentRef ?? "WhatsApp screenshot";
    // Triggers the "payment received" reply to the customer and the owner alert.
    await submitPayment(order.code, tid, profileName ?? order.customerName, key);
    await markReplied();
    return;
  }

  // 3. Transaction ID typed as text.
  const tid = text.match(TID_RE)?.[1];
  if (tid && order && awaitingPayment) {
    await submitPayment(order.code, tid, profileName ?? order.customerName, null);
    await markReplied();
    return;
  }

  // 4. Buttons and explicit requests.
  if (btn === "shop") {
    await reply(waId, `Browse everything here: ${store.url}/shop\nToday's deals: ${store.url}/shop?sale=1`, ref);
    await markReplied();
    return;
  }

  if (order) {
    if (order.status === "awaiting_payment" && (btn?.startsWith("pay:") || code || /\b(pay|payment|account|iban|qr)\b/i.test(text) || !btn)) {
      const chosen = paymentAccounts.find((a) => a.id === order.paymentAccount);
      await reply(waId, paymentInstructions(order), {
        ...ref,
        imageLink: chosen?.qrImage ? `${store.url}${chosen.qrImage}` : undefined,
        buttons: [{ id: "human", title: "Talk to a person" }],
      });
    } else {
      await reply(waId, `${orderStageText(order)}\n\nStatus: *${statusLabel(order.status)}*\nDetails: ${store.url}/order/${order.code}`, {
        ...ref,
        buttons: orderButtons(order),
      });
    }
    await markReplied();
    return;
  }

  // 5. Unknown sender / no active order — friendly greeting, at most every 30 minutes.
  if (!contact?.last_bot_reply_at || contact.last_bot_reply_at < now() - 1800) {
    await reply(
      waId,
      `Assalam o Alaikum${profileName ? ` ${profileName.split(" ")[0]}` : ""}! Welcome to ${store.name} — ${store.tagline}.\n\n🛒 Shop: ${store.url}/shop\n📦 Track an order: send your order number (RV-…)\n🕗 ${store.contact.hours}`,
      { buttons: [{ id: "shop", title: "Shop deals" }, { id: "human", title: "Talk to a person" }] },
    );
    await markReplied();
  }
}

/* ------------------------------ owner commands ---------------------------- */

const HELP = [
  "*Raavi Volt admin commands*",
  "orders — what needs attention",
  "status RV-XXXXXXXXXX",
  "confirm RV-XXXXXXXXXX",
  "ship RV-XXXXXXXXXX TCS 123456789",
  "deliver RV-XXXXXXXXXX",
  "cancel RV-XXXXXXXXXX reason…",
  "(the RV- prefix is optional)",
].join("\n");

function matchCourier(token: string | undefined) {
  if (!token) return null;
  const t = token.toLowerCase();
  return couriers.find((c) => c.toLowerCase().split(/[\s(]/)[0] === t || c.toLowerCase().replace(/\W/g, "") === t.replace(/\W/g, "")) ?? null;
}

async function handleOwnerCommand(waId: string, text: string) {
  const [cmdRaw = "", codeRaw = "", ...rest] = text.split(/\s+/);
  const cmd = cmdRaw.toLowerCase();
  const say = (body: string) => reply(waId, body);

  if (cmd === "orders" || cmd === "pending") {
    const list = await pendingOrders(10);
    await say(
      list.length
        ? `*Needs attention*\n${list.map((o) => `${o.code} · Rs ${pkr.format(o.total)} · ${o.customerName} · ${statusLabel(o.status)}`).join("\n")}`
        : "All caught up — no pending orders. ✅",
    );
    return;
  }

  const transitions: Record<string, OrderStatus> = { confirm: "confirmed", ok: "confirmed", ship: "shipped", deliver: "delivered", delivered: "delivered", cancel: "cancelled" };
  if (!(cmd in transitions) && cmd !== "status") {
    await say(HELP);
    return;
  }

  const code = normaliseCode(codeRaw);
  const order = code ? await getOrderByCode(code) : null;
  if (!order) {
    await say(`I couldn't find order "${codeRaw}". Try: ${cmd} RV-XXXXXXXXXX`);
    return;
  }

  if (cmd === "status") {
    await say(
      `*${order.code}* — ${statusLabel(order.status)}\n${order.customerName} · ${order.phone} · ${order.city}\nRs ${pkr.format(order.total)} · ref ${order.paymentRef ?? "—"}\n${store.url}/admin/orders/${order.code}`,
    );
    return;
  }

  const next = transitions[cmd];
  const courier = next === "shipped" ? matchCourier(rest[0]) : null;
  const tracking = next === "shipped" ? (courier ? rest.slice(1) : rest).join(" ") || null : null;
  await updateOrderStatus(order.code, next, {
    courier,
    trackingNumber: tracking,
    reason: next === "cancelled" ? rest.join(" ") || null : null,
  });
  const updated = await getOrderByCode(order.code);
  await say(`✅ ${order.code} → *${statusLabel(updated?.status ?? next)}*${courier ? ` via ${courier}` : ""}${tracking ? ` (${tracking})` : ""}. Customer ${order.whatsappOptIn ? "notified" : "opted out of WhatsApp"}.`);
}
