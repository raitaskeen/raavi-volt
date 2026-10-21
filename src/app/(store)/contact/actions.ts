"use server";

import { createMessage } from "@/lib/messages";
import { rateLimit } from "@/lib/rate-limit";
import { contactSchema, fieldErrors, type FieldErrors } from "@/lib/validation";

export type ContactState = { ok: true; name: string; optIn: boolean } | { ok: false; errors?: FieldErrors; message?: string } | null;

export async function sendContactMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {
  // Honeypot: real people never fill the hidden "company" field.
  if (String(formData.get("company") ?? "")) return { ok: true, name: "there", optIn: false };

  const parsed = contactSchema.safeParse({
    name: formData.get("name") ?? "",
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
    topic: formData.get("topic") ?? "",
    orderCode: formData.get("orderCode") ?? "",
    body: formData.get("body") ?? "",
    whatsappOptIn: formData.get("whatsappOptIn") === "on",
  });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  if (!(await rateLimit("contact"))) return { ok: false, message: "Too many messages in a short time. Please wait a minute." };

  try {
    await createMessage(parsed.data);
    return { ok: true, name: parsed.data.name.split(" ")[0] ?? parsed.data.name, optIn: parsed.data.whatsappOptIn };
  } catch (err) {
    console.error("contact failed", err);
    return { ok: false, message: "Something went wrong. Please try WhatsApp instead." };
  }
}
