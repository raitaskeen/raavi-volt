"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { updateOrderStatus } from "@/lib/orders";
import { statusSchema } from "@/lib/validation";
import type { OrderStatus } from "@/config/store";

export async function setOrderStatus(code: string, formData: FormData) {
  await requireAdmin();
  const status = statusSchema.parse(formData.get("status")) as OrderStatus;
  await updateOrderStatus(code, status);
  revalidatePath(`/admin/orders/${code}`);
  revalidatePath(`/order/${code}`);
}
