import { z } from "zod";
import { categories, cities, paymentAccounts, orderStatuses } from "@/config/store";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

/** Accepts 03XXXXXXXXX, 03XX-XXXXXXX, +923XXXXXXXXX → normalised 03XXXXXXXXX. */
export const pkPhone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .refine((v) => /^(?:\+?92|0)3\d{9}$/.test(v), "Enter a valid Pakistani mobile number, e.g. 0300-1234567")
  .transform((v) => `0${v.slice(-10)}`);

export const checkoutSchema = z.object({
  customerName: z.string().trim().min(3, "Please enter your full name").max(80),
  phone: pkPhone,
  email: z
    .string()
    .trim()
    .max(120)
    .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email address")
    .transform((v) => (v === "" ? null : v.toLowerCase())),
  city: z.enum(cities, { error: "Please choose your city" }),
  area: optionalText(80),
  address: z.string().trim().min(10, "Please enter your complete address (house, street, block)").max(300),
  postalCode: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{5}$/.test(v), "Postal code is 5 digits")
    .transform((v) => (v === "" ? null : v)),
  notes: optionalText(500),
  paymentAccount: z.enum(paymentAccounts.map((a) => a.id) as [string, ...string[]], {
    error: "Choose an account to pay into",
  }),
  lines: z
    .array(z.object({ productId: z.string().min(1).max(64), qty: z.number().int().min(1).max(20) }))
    .min(1, "Your cart is empty")
    .max(50),
});

export const paymentSchema = z.object({
  code: z.string().regex(/^RV-[A-Z0-9]{10}$/),
  paymentRef: z.string().trim().min(4, "Enter the transaction / reference ID from your receipt").max(64),
  paymentPayer: z.string().trim().min(3, "Enter the account holder name you paid from").max(80),
});

export const specSchema = z.object({ label: z.string().trim().min(1).max(60), value: z.string().trim().min(1).max(160) });

const money = (label: string) =>
  z.coerce
    .number({ error: `${label} must be a number` })
    .int(`${label} must be a whole number`)
    .min(0, `${label} can't be negative`)
    .max(10_000_000);

export const productSchema = z
  .object({
    name: z.string().trim().min(3, "Name is too short").max(120),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes")
      .max(80),
    brand: z.string().trim().min(1, "Brand is required").max(40),
    category: z.enum(categories.map((c) => c.slug) as [string, ...string[]], { error: "Pick a category" }),
    sku: optionalText(40),
    price: money("Price").min(1, "Price is required"),
    compareAt: z
      .string()
      .trim()
      .transform((v) => (v === "" ? null : Number(v)))
      .refine((v) => v === null || (Number.isInteger(v) && v >= 0), "Compare-at price must be a whole number"),
    stock: z.coerce.number().int("Stock must be a whole number").min(0).max(100_000),
    shortDesc: z.string().trim().max(200).default(""),
    description: z.string().trim().max(5000).default(""),
    specs: z.array(specSchema).max(30),
    images: z.array(z.string().regex(/^products\/[\w-]+\.(webp|jpe?g|png|avif)$/)).max(10),
    warranty: optionalText(80),
    featured: z.boolean(),
    active: z.boolean(),
  })
  .refine((p) => p.compareAt === null || p.compareAt > p.price, {
    path: ["compareAt"],
    message: "Compare-at price should be higher than the price (or leave it empty)",
  });

export const statusSchema = z.enum(orderStatuses.map((s) => s.value) as [string, ...string[]]);

export type FieldErrors = Partial<Record<string, string>>;

/** First error message per field, for inline display. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
