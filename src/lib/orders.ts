import { db } from "@/lib/cf";
import { shippingFor, type OrderStatus } from "@/config/store";
import { getProductsByIds } from "@/lib/products";
import { notifyCustomer, notifyNewOrder, notifyPaymentSubmitted } from "@/lib/notifications";

export type OrderItem = {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  category?: string;
  price: number;
  qty: number;
};

export type Order = {
  id: string;
  code: string;
  customerName: string;
  phone: string;
  email: string | null;
  city: string;
  area: string | null;
  address: string;
  postalCode: string | null;
  notes: string | null;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentAccount: string;
  paymentRef: string | null;
  paymentPayer: string | null;
  paymentProof: string | null;
  status: OrderStatus;
  whatsappOptIn: boolean;
  courier: string | null;
  trackingNumber: string | null;
  cancelReason: string | null;
  createdAt: number;
  updatedAt: number;
};

type Row = {
  id: string;
  code: string;
  customer_name: string;
  phone: string;
  email: string | null;
  city: string;
  area: string | null;
  address: string;
  postal_code: string | null;
  notes: string | null;
  items: string;
  subtotal: number;
  shipping: number;
  total: number;
  payment_account: string;
  payment_ref: string | null;
  payment_payer: string | null;
  payment_proof: string | null;
  status: OrderStatus;
  whatsapp_opt_in: number;
  courier: string | null;
  tracking_number: string | null;
  cancel_reason: string | null;
  created_at: number;
  updated_at: number;
};

function toOrder(r: Row): Order {
  return {
    id: r.id,
    code: r.code,
    customerName: r.customer_name,
    phone: r.phone,
    email: r.email,
    city: r.city,
    area: r.area,
    address: r.address,
    postalCode: r.postal_code,
    notes: r.notes,
    items: JSON.parse(r.items) as OrderItem[],
    subtotal: r.subtotal,
    shipping: r.shipping,
    total: r.total,
    paymentAccount: r.payment_account,
    paymentRef: r.payment_ref,
    paymentPayer: r.payment_payer,
    paymentProof: r.payment_proof,
    status: r.status,
    whatsappOptIn: r.whatsapp_opt_in === 1,
    courier: r.courier,
    trackingNumber: r.tracking_number,
    cancelReason: r.cancel_reason,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// Crockford-ish alphabet without look-alike characters (0/O, 1/I/L).
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** Unguessable public order code, e.g. RV-7K3M9QXA2T. */
function newOrderCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return `RV-${Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("")}`;
}

export class OrderError extends Error {}

export type NewOrder = {
  customerName: string;
  phone: string;
  email: string | null;
  city: string;
  area: string | null;
  address: string;
  postalCode: string | null;
  notes: string | null;
  paymentAccount: string;
  whatsappOptIn: boolean;
  lines: { productId: string; qty: number }[];
};

/**
 * Creates an order using prices and stock read from D1 — never from the client.
 * Stock decrement and order insert run in one D1 batch (a single transaction);
 * the `CHECK (stock >= 0)` constraint aborts the whole batch on oversell.
 */
export async function createOrder(input: NewOrder) {
  const qtyById = new Map<string, number>();
  for (const l of input.lines) qtyById.set(l.productId, (qtyById.get(l.productId) ?? 0) + l.qty);

  const products = await getProductsByIds([...qtyById.keys()]);
  if (products.length !== qtyById.size) throw new OrderError("Some items in your cart are no longer available.");

  const items: OrderItem[] = [];
  for (const p of products) {
    const qty = qtyById.get(p.id)!;
    if (!p.active) throw new OrderError(`${p.name} is no longer available.`);
    if (p.stock < qty) {
      throw new OrderError(p.stock === 0 ? `${p.name} just sold out.` : `Only ${p.stock} × ${p.name} left in stock.`);
    }
    items.push({ productId: p.id, slug: p.slug, name: p.name, image: p.images[0] ?? null, category: p.category, price: p.price, qty });
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const shipping = shippingFor(input.city, subtotal);
  const total = subtotal + shipping;
  const id = crypto.randomUUID();
  const code = newOrderCode();

  const d = db();
  try {
    await d.batch([
      ...items.map((i) =>
        d.prepare("UPDATE products SET stock = stock - ?, updated_at = unixepoch() WHERE id = ?").bind(i.qty, i.productId),
      ),
      d
        .prepare(
          `INSERT INTO orders (id, code, customer_name, phone, email, city, area, address, postal_code, notes, items, subtotal, shipping, total, payment_account, whatsapp_opt_in)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          id,
          code,
          input.customerName,
          input.phone,
          input.email,
          input.city,
          input.area,
          input.address,
          input.postalCode,
          input.notes,
          JSON.stringify(items),
          subtotal,
          shipping,
          total,
          input.paymentAccount,
          input.whatsappOptIn ? 1 : 0,
        ),
    ]);
  } catch (err) {
    if (String(err).includes("CHECK constraint")) throw new OrderError("An item sold out while you were checking out.");
    throw err;
  }

  const order = await getOrderByCode(code);
  if (order) notifyNewOrder(order);
  return { code, total };
}

export async function getOrderByCode(code: string) {
  const row = await db().prepare("SELECT * FROM orders WHERE code = ?").bind(code).first<Row>();
  return row ? toOrder(row) : null;
}

export async function submitPayment(code: string, ref: string, payer: string, proofKey: string | null) {
  const res = await db()
    .prepare(
      `UPDATE orders SET payment_ref = ?, payment_payer = ?, payment_proof = COALESCE(?, payment_proof),
         status = 'payment_submitted', updated_at = unixepoch()
       WHERE code = ? AND status IN ('awaiting_payment', 'payment_submitted')`,
    )
    .bind(ref, payer, proofKey, code)
    .run();
  if (res.meta.changes === 0) return false;
  const order = await getOrderByCode(code);
  if (order) notifyPaymentSubmitted(order);
  return true;
}

/* ---------------------------------- admin --------------------------------- */

export async function listOrders({ status, page = 1, pageSize = 30 }: { status?: string; page?: number; pageSize?: number }) {
  const where = status ? "WHERE status = ?" : "";
  const binds = status ? [status] : [];
  const d = db();
  const [rows, count] = await d.batch([
    d.prepare(`SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(...binds, pageSize, (page - 1) * pageSize),
    d.prepare(`SELECT COUNT(*) AS n FROM orders ${where}`).bind(...binds),
  ]);
  const total = (count.results[0] as { n: number } | undefined)?.n ?? 0;
  return { items: (rows.results as Row[]).map(toOrder), total, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export type StatusExtra = { courier?: string | null; trackingNumber?: string | null; reason?: string | null; notify?: boolean };

/**
 * Updates status (plus shipment / cancellation details) and sends the customer
 * a WhatsApp update. Cancelling puts items back in stock (once).
 */
export async function updateOrderStatus(code: string, status: OrderStatus, extra: StatusExtra = {}) {
  const order = await getOrderByCode(code);
  if (!order || order.status === status) return;
  const d = db();
  const stmts = [
    d
      .prepare(
        `UPDATE orders SET status = ?, updated_at = unixepoch(),
           courier = COALESCE(?, courier), tracking_number = COALESCE(?, tracking_number), cancel_reason = ?
         WHERE code = ?`,
      )
      .bind(status, extra.courier ?? null, extra.trackingNumber ?? null, status === "cancelled" ? (extra.reason ?? null) : null, code),
  ];
  const restock = (sign: 1 | -1) =>
    order.items.map((i) => d.prepare("UPDATE products SET stock = stock + ? WHERE id = ?").bind(sign * i.qty, i.productId));
  if (status === "cancelled") stmts.push(...restock(1));
  else if (order.status === "cancelled") stmts.push(...restock(-1));
  await d.batch(stmts);

  if (extra.notify !== false && status !== "awaiting_payment") {
    const updated = await getOrderByCode(code);
    if (updated) notifyCustomer(updated, status);
  }
}

export async function orderStats() {
  const row = await db()
    .prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status = 'payment_submitted' THEN 1 ELSE 0 END) AS to_verify,
              SUM(CASE WHEN status = 'awaiting_payment' THEN 1 ELSE 0 END) AS awaiting,
              SUM(CASE WHEN status IN ('confirmed', 'shipped', 'delivered') THEN total ELSE 0 END) AS revenue
       FROM orders`,
    )
    .first<{ total: number; to_verify: number | null; awaiting: number | null; revenue: number | null }>();
  return {
    total: row?.total ?? 0,
    toVerify: row?.to_verify ?? 0,
    awaiting: row?.awaiting ?? 0,
    revenue: row?.revenue ?? 0,
  };
}

/** Cancels (and restocks) unpaid orders older than `hours`. Cheap; run on admin views and checkout. */
export async function expireStaleOrders(hours: number) {
  const { results } = await db()
    .prepare("SELECT code FROM orders WHERE status = 'awaiting_payment' AND created_at < unixepoch() - ? LIMIT 25")
    .bind(hours * 3600)
    .all<{ code: string }>();
  for (const { code } of results) {
    await updateOrderStatus(code, "cancelled", { reason: `payment was not received within ${hours} hours` });
  }
  return results.length;
}

/** Customer order lookup: code + phone must both match. */
export async function findOrderForCustomer(code: string, phone: string) {
  const row = await db().prepare("SELECT code FROM orders WHERE code = ? AND phone = ?").bind(code, phone).first<{ code: string }>();
  return row?.code ?? null;
}

/** The customer's most recent order that is still in progress (for WhatsApp replies). */
export async function latestActiveOrderByPhone(phone: string) {
  const row = await db()
    .prepare("SELECT * FROM orders WHERE phone = ? AND status NOT IN ('delivered', 'cancelled') ORDER BY created_at DESC LIMIT 1")
    .bind(phone)
    .first<Row>();
  return row ? toOrder(row) : null;
}

/** Orders that need the owner's attention, newest first (WhatsApp "orders" command). */
export async function pendingOrders(limit = 10) {
  const { results } = await db()
    .prepare("SELECT * FROM orders WHERE status IN ('payment_submitted', 'awaiting_payment', 'confirmed') ORDER BY status = 'payment_submitted' DESC, created_at DESC LIMIT ?")
    .bind(limit)
    .all<Row>();
  return results.map(toOrder);
}
