"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { deleteFiles } from "@/lib/storage";
import { createProduct, deleteProduct, getProductById, slugExists, updateProduct } from "@/lib/products";
import { fieldErrors, productSchema, type FieldErrors } from "@/lib/validation";
import { slugify } from "@/lib/utils";

export type ProductFormState = { ok: false; errors?: FieldErrors; message?: string } | null;

function parseJSONField(formData: FormData, key: string) {
  try {
    return JSON.parse(String(formData.get(key) ?? "[]"));
  } catch {
    return [];
  }
}

async function deleteImages(keys: string[]) {
  await deleteFiles(keys).catch((e) => console.error("image delete failed", e));
}

export async function saveProduct(id: string | null, _prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "");
  const parsed = productSchema.safeParse({
    name,
    slug: String(formData.get("slug") ?? "").trim() || slugify(name),
    brand: formData.get("brand") ?? "",
    category: formData.get("category") ?? "",
    sku: formData.get("sku") ?? "",
    price: formData.get("price") ?? "",
    compareAt: String(formData.get("compareAt") ?? ""),
    stock: formData.get("stock") ?? "0",
    shortDesc: formData.get("shortDesc") ?? "",
    description: formData.get("description") ?? "",
    specs: (parseJSONField(formData, "specs") as { label: string; value: string }[]).filter((s) => s.label?.trim() && s.value?.trim()),
    images: parseJSONField(formData, "images"),
    warranty: formData.get("warranty") ?? "",
    featured: formData.get("featured") === "on",
    active: formData.get("active") === "on",
  });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), message: "Please fix the highlighted fields." };

  const input = parsed.data;
  if (await slugExists(input.slug, id ?? undefined)) {
    return { ok: false, errors: { slug: "Another product already uses this URL slug" } };
  }

  if (id) {
    const existing = await getProductById(id);
    if (!existing) return { ok: false, message: "This product no longer exists." };
    await updateProduct(id, input);
    await deleteImages(existing.images.filter((k) => !input.images.includes(k)));
  } else {
    await createProduct(input);
  }

  revalidatePath("/", "layout");
  redirect(`/admin/products?saved=${encodeURIComponent(input.name)}`);
}

export async function removeProduct(id: string) {
  await requireAdmin();
  const existing = await getProductById(id);
  if (!existing) return;
  await deleteProduct(id);
  await deleteImages(existing.images);
  revalidatePath("/", "layout");
}
