import { isAdmin } from "@/lib/auth";
import { media } from "@/lib/cf";

/** Private payment screenshots — admin only, never cached publicly. */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const key = (await params).key.join("/");
  if (!key.startsWith("proofs/")) return new Response("Not found", { status: 404 });

  const object = await media().get(key);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body as unknown as ReadableStream, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "image/webp",
      "Cache-Control": "private, no-store",
    },
  });
}
