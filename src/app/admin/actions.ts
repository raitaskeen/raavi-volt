"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession, verifyPassword } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export type LoginState = { error: string } | null;

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  if (!password) return { error: "Enter the admin password." };
  if (!(await rateLimit("login", 5))) return { error: "Too many attempts. Wait a minute and try again." };
  if (!(await verifyPassword(password))) {
    // Small fixed delay blunts brute-force attempts.
    await new Promise((r) => setTimeout(r, 600));
    return { error: "Incorrect password." };
  }
  await createSession();
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}
