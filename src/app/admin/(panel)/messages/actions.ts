"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { setMessageStatus } from "@/lib/messages";

const status = z.enum(["new", "replied", "closed"]);

export async function updateMessageStatus(id: string, formData: FormData) {
  await requireAdmin();
  await setMessageStatus(id, status.parse(formData.get("status")));
  revalidatePath("/admin/messages");
  revalidatePath(`/admin/messages/${id}`);
}
