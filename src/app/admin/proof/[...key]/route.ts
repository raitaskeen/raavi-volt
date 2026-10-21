import { isAdmin } from "@/lib/auth";
import { getFile } from "@/lib/storage";

/** Private payment screenshots — admin only, never cached publicly. */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const key = (await params).key.join("/");
  if (!key.startsWith("proofs/")) return new Response("Not found", { status: 404 });

  const file = await getFile(key);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(file.bytes, {
    headers: { "Content-Type": file.contentType, "Cache-Control": "private, no-store" },
  });
}
