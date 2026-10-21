import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/site/logo";
import { LoginForm } from "@/components/admin/login-form";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="grid-paper grid min-h-dvh place-items-center p-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-[0_20px_60px_-30px_rgb(0_0_0/0.35)] sm:p-8">
        <Logo />
        <h1 className="mt-8 text-xl font-semibold">Admin sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage products, images and orders.</p>
        <LoginForm />
      </div>
    </main>
  );
}
