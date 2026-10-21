/**
 * WhatsApp message templates — the single source of truth.
 *
 * Each one must be created and approved in Meta's WhatsApp Manager with the
 * exact same name, category "Utility", language "English (en)" and body below
 * (`{{n}}` are the variables). `bun run whatsapp:doc` regenerates
 * docs/WHATSAPP_TEMPLATES.md from this file.
 *
 * The same text is rendered for the manual "send on WhatsApp" fallback, so
 * customers get identical wording either way.
 */
export type TemplateDef = {
  name: string;
  audience: "customer" | "admin";
  when: string;
  body: string;
  example: string[];
};

export const templates = {
  orderPlaced: {
    name: "rv_order_placed",
    audience: "customer",
    when: "Customer places an order",
    body: "Assalam o Alaikum {{1}}! Thank you for shopping with Raavi Volt. Your order {{2}} for Rs {{3}} has been placed. Please pay to {{4}} and submit your transaction ID here: {{5}} - We reserve your items for 72 hours.",
    example: ["Ali", "RV-7K3M9QXA2T", "18,499", "Meezan Bank 0201 0000000000", "https://raavivolt.pk/order/RV-7K3M9QXA2T"],
  },
  paymentReceived: {
    name: "rv_payment_received",
    audience: "customer",
    when: "Customer submits payment details",
    body: "Hi {{1}}, we have received your payment details for order {{2}} (ref {{3}}). Our team is verifying it now and will confirm your order shortly.",
    example: ["Ali", "RV-7K3M9QXA2T", "0123456789"],
  },
  orderConfirmed: {
    name: "rv_order_confirmed",
    audience: "customer",
    when: "Admin verifies the payment",
    body: "Good news {{1}}! Payment for order {{2}} is verified and your order is confirmed. We are packing it now. Track it here: {{3}} - Thank you for choosing Raavi Volt.",
    example: ["Ali", "RV-7K3M9QXA2T", "https://raavivolt.pk/order/RV-7K3M9QXA2T"],
  },
  orderShipped: {
    name: "rv_order_shipped",
    audience: "customer",
    when: "Admin marks the order as shipped",
    body: "Hi {{1}}, your order {{2}} is on its way with {{3}} (tracking: {{4}}). Expected delivery {{5}}. Track it here: {{6}} - Please keep your phone on for the rider.",
    example: ["Ali", "RV-7K3M9QXA2T", "TCS", "1234567890", "within 24 hours", "https://raavivolt.pk/order/RV-7K3M9QXA2T"],
  },
  orderDelivered: {
    name: "rv_order_delivered",
    audience: "customer",
    when: "Admin marks the order as delivered",
    body: "Your order {{1}} has been delivered. We hope you love it, {{2}}! For warranty or after-sales help, just reply to this message. - Raavi Volt",
    example: ["RV-7K3M9QXA2T", "Ali"],
  },
  orderCancelled: {
    name: "rv_order_cancelled",
    audience: "customer",
    when: "Order is cancelled (by admin or unpaid after 72 hours)",
    body: "Hi {{1}}, your order {{2}} has been cancelled. Reason: {{3}}. If this is a mistake or you would like to reorder, reply here and we will help.",
    example: ["Ali", "RV-7K3M9QXA2T", "payment was not received within 72 hours"],
  },
  contactReceived: {
    name: "rv_contact_received",
    audience: "customer",
    when: "Customer sends the contact form",
    body: "Hi {{1}}, thanks for contacting Raavi Volt about {{2}}. We have received your message and will reply here during business hours.",
    example: ["Ali", "Warranty / repair"],
  },
  adminAlert: {
    name: "rv_admin_alert",
    audience: "admin",
    when: "New order, payment submitted, or new contact message (sent to the store owner)",
    body: "Raavi Volt alert: {{1}}. Details: {{2}}. Open: {{3}} - sent automatically.",
    example: ["New order RV-7K3M9QXA2T", "Ali, Lahore, Rs 18,499", "https://raavivolt.pk/admin/orders/RV-7K3M9QXA2T"],
  },
} satisfies Record<string, TemplateDef>;

export type TemplateKey = keyof typeof templates;

/** WhatsApp rejects parameters with newlines, tabs or 4+ spaces, and empty values. */
export function cleanParam(value: string) {
  const v = value.replace(/[\n\r\t]+/g, " ").replace(/ {2,}/g, " ").trim().slice(0, 900);
  return v || "-";
}

export function renderTemplate(key: TemplateKey, params: string[]) {
  return templates[key].body.replace(/\{\{(\d+)\}\}/g, (_, n) => cleanParam(params[Number(n) - 1] ?? ""));
}
