import { deliveryEta, paymentAccounts, store, whatsappConfig, type OrderStatus } from "@/config/store";
import type { Order } from "@/lib/orders";
import { sendTemplate } from "@/lib/whatsapp";
import { renderTemplate, type TemplateKey } from "@/lib/whatsapp-templates";

const pkr = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 });
const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;
const orderUrl = (code: string) => `${store.url}/order/${code}`;
const adminUrl = (path: string) => `${store.url}/admin${path}`;

function payTo(order: Order) {
  const a = paymentAccounts.find((x) => x.id === order.paymentAccount) ?? paymentAccounts[0];
  return `${a.bank} ${a.iban ?? a.accountNumber} (${a.accountTitle})`;
}

/** The customer message for an order stage — used for automatic sends and the admin's manual fallback. */
export function orderStageMessage(order: Order, stage: OrderStatus = order.status): { template: TemplateKey; params: string[] } {
  const name = firstName(order.customerName);
  switch (stage) {
    case "awaiting_payment":
      return { template: "orderPlaced", params: [name, order.code, pkr.format(order.total), payTo(order), orderUrl(order.code)] };
    case "payment_submitted":
      return { template: "paymentReceived", params: [name, order.code, order.paymentRef ?? "-"] };
    case "confirmed":
      return { template: "orderConfirmed", params: [name, order.code, orderUrl(order.code)] };
    case "shipped":
      return {
        template: "orderShipped",
        params: [name, order.code, order.courier ?? "our rider", order.trackingNumber ?? "shared by the rider", deliveryEta(order.city), orderUrl(order.code)],
      };
    case "delivered":
      return { template: "orderDelivered", params: [order.code, name] };
    case "cancelled":
      return { template: "orderCancelled", params: [name, order.code, order.cancelReason ?? "cancelled by the store"] };
  }
}

export function orderStageText(order: Order, stage: OrderStatus = order.status) {
  const m = orderStageMessage(order, stage);
  return renderTemplate(m.template, m.params);
}

/** Automatic customer update for a stage — only if they opted in at checkout. */
export function notifyCustomer(order: Order, stage: OrderStatus = order.status) {
  if (!order.whatsappOptIn) return;
  sendTemplate({ to: order.phone, orderCode: order.code, ...orderStageMessage(order, stage) });
}

/** Alert to the store owner's WhatsApp. */
export function notifyAdmin(title: string, details: string, path: string, ref: { orderCode?: string; messageId?: string } = {}) {
  if (!whatsappConfig.adminNumber) return;
  sendTemplate({ to: whatsappConfig.adminNumber, template: "adminAlert", params: [title, details, adminUrl(path)], ...ref });
}

export function notifyNewOrder(order: Order) {
  notifyCustomer(order, "awaiting_payment");
  const items = order.items.reduce((n, i) => n + i.qty, 0);
  notifyAdmin(
    `New order ${order.code}`,
    `${order.customerName}, ${order.city}, ${items} item${items === 1 ? "" : "s"}, Rs ${pkr.format(order.total)}`,
    `/orders/${order.code}`,
    { orderCode: order.code },
  );
}

export function notifyPaymentSubmitted(order: Order) {
  notifyCustomer(order, "payment_submitted");
  notifyAdmin(
    `Payment to verify for ${order.code}`,
    `Rs ${pkr.format(order.total)} ref ${order.paymentRef ?? "-"} from ${order.paymentPayer ?? order.customerName}`,
    `/orders/${order.code}`,
    { orderCode: order.code },
  );
}
