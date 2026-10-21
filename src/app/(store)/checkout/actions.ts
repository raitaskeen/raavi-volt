"use server";

import { checkoutSchema, fieldErrors, paymentSchema, type FieldErrors } from "@/lib/validation";
import { createOrder, expireStaleOrders, getOrderByCode, OrderError, submitPayment } from "@/lib/orders";
import { rateLimit } from "@/lib/rate-limit";
import { orderHoldHours } from "@/config/store";
import { putFile } from "@/lib/storage";
import { extensionFor, sniffFileType } from "@/lib/file-type";
import { revalidatePath } from "next/cache";

export type CheckoutState = { ok: true; code: string } | { ok: false; errors?: FieldErrors; message?: string } | null;

export async function placeOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  let lines: unknown;
  try {
    lines = JSON.parse(String(formData.get("lines") ?? "[]"));
  } catch {
    return { ok: false, message: "Your cart could not be read. Please refresh and try again." };
  }

  const parsed = checkoutSchema.safeParse({
    customerName: formData.get("customerName") ?? "",
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
    city: formData.get("city") ?? "",
    area: formData.get("area") ?? "",
    address: formData.get("address") ?? "",
    postalCode: formData.get("postalCode") ?? "",
    notes: formData.get("notes") ?? "",
    paymentAccount: formData.get("paymentAccount") ?? "",
    whatsappOptIn: formData.get("whatsappOptIn") === "on",
    lines,
  });
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    return { ok: false, errors, message: errors.lines ?? "Please fix the highlighted fields." };
  }

  if (!(await rateLimit("checkout"))) return { ok: false, message: "Too many orders in a short time. Please wait a minute." };

  try {
    // Release stock held by abandoned unpaid orders before checking availability.
    await expireStaleOrders(orderHoldHours);
    const { code } = await createOrder(parsed.data);
    return { ok: true, code };
  } catch (err) {
    if (err instanceof OrderError) return { ok: false, message: err.message };
    console.error("placeOrder failed", err);
    return { ok: false, message: "Something went wrong placing your order. Please try again." };
  }
}

export type PaymentState = { ok: true } | { ok: false; errors?: FieldErrors; message?: string } | null;

const MAX_PROOF_BYTES = 5 * 1024 * 1024;
const PROOF_TYPES = new Set(["image/webp", "image/jpeg", "image/png"]);

export async function submitPaymentAction(_prev: PaymentState, formData: FormData): Promise<PaymentState> {
  const parsed = paymentSchema.safeParse({
    code: formData.get("code"),
    paymentRef: formData.get("paymentRef") ?? "",
    paymentPayer: formData.get("paymentPayer") ?? "",
  });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), message: "Please fix the highlighted fields." };

  if (!(await rateLimit("payment"))) return { ok: false, message: "Too many attempts. Please wait a minute." };

  const { code, paymentRef, paymentPayer } = parsed.data;
  const order = await getOrderByCode(code);
  if (!order) return { ok: false, message: "Order not found." };

  let proofKey: string | null = null;
  const file = formData.get("proof");
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_PROOF_BYTES) return { ok: false, errors: { proof: "Image must be under 5 MB" } };
    // Check the real file contents, not the browser-declared type.
    const bytes = await file.arrayBuffer();
    const type = sniffFileType(bytes);
    if (!type || !PROOF_TYPES.has(type)) return { ok: false, errors: { proof: "Upload a JPG, PNG or WebP image" } };
    proofKey = `proofs/${code}/${crypto.randomUUID()}.${extensionFor[type]}`;
    await putFile(proofKey, bytes, type);
  }

  const updated = await submitPayment(code, paymentRef, paymentPayer, proofKey);
  if (!updated) return { ok: false, message: "This order is no longer awaiting payment." };
  revalidatePath(`/order/${code}`);
  return { ok: true };
}
