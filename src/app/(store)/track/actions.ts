"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { findOrderForCustomer } from "@/lib/orders";
import { rateLimit } from "@/lib/rate-limit";
import { fieldErrors, pkPhone, type FieldErrors } from "@/lib/validation";

export type TrackState = { errors?: FieldErrors; message?: string } | null;

const trackSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .transform((v) => (v.startsWith("RV-") ? v : `RV-${v}`))
    .refine((v) => /^RV-[A-Z0-9]{10}$/.test(v), "Order numbers look like RV-7K3M9QXA2T"),
  phone: pkPhone,
});

export async function trackOrder(_prev: TrackState, formData: FormData): Promise<TrackState> {
  const parsed = trackSchema.safeParse({ code: formData.get("code") ?? "", phone: formData.get("phone") ?? "" });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  if (!(await rateLimit("track"))) return { message: "Too many lookups. Please wait a minute." };

  const code = await findOrderForCustomer(parsed.data.code, parsed.data.phone);
  if (!code) return { message: "We couldn't find an order with that number and phone. Check both and try again." };
  redirect(`/order/${code}`);
}
