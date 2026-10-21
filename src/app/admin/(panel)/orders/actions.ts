"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getOrderByCode, updateOrderStatus } from "@/lib/orders";
import { orderStageMessage } from "@/lib/notifications";
import { sendTemplateNow } from "@/lib/whatsapp";
import { statusUpdateSchema } from "@/lib/validation";
import type { OrderStatus } from "@/config/store";

function refresh(code: string) {
  revalidatePath(`/admin/orders/${code}`);
  revalidatePath(`/order/${code}`);
}

export async function setOrderStatus(code: string, formData: FormData) {
  await requireAdmin();
  const parsed = statusUpdateSchema.parse({
    status: formData.get("status"),
    courier: String(formData.get("courier") ?? ""),
    trackingNumber: String(formData.get("trackingNumber") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  });
  await updateOrderStatus(code, parsed.status as OrderStatus, {
    courier: parsed.courier,
    trackingNumber: parsed.trackingNumber,
    reason: parsed.reason,
    notify: formData.get("silent") !== "1",
  });
  refresh(code);
}

export type ResendState = { ok: boolean; message: string } | null;

/** Re-sends the WhatsApp update for the order's current stage (waits for the result). */
export async function resendOrderUpdate(code: string, _prev: ResendState): Promise<ResendState> {
  await requireAdmin();
  const order = await getOrderByCode(code);
  if (!order) return { ok: false, message: "Order not found." };
  const res = await sendTemplateNow({ to: order.phone, orderCode: order.code, ...orderStageMessage(order) });
  refresh(code);
  if (res.status === "sent") return { ok: true, message: "WhatsApp update sent." };
  if (res.status === "skipped") return { ok: false, message: "WhatsApp API isn't configured yet — use “Send manually” instead." };
  return { ok: false, message: `WhatsApp rejected it: ${res.error}` };
}
