import { media } from "@/lib/cf";

/**
 * Serves public product images from R2. Keys are random UUIDs, so responses
 * are immutable and cached at the edge with the Workers Cache API.
 */
export async function GET(request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.join("/");
  // Only product images are public — payment proofs stay private.
  if (!/^products\/[\w-]+\.(webp|jpe?g|png|avif)$/.test(key)) return new Response("Not found", { status: 404 });

  const cache = (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default;
  const cached = await cache?.match(request).catch(() => undefined);
  if (cached) return cached;

  const object = await media().get(key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  headers.set("Content-Type", object.httpMetadata?.contentType ?? "image/webp");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("ETag", object.httpEtag);

  const response = new Response(object.body as unknown as ReadableStream, { headers });
  await cache?.put(request, response.clone()).catch(() => undefined);
  return response;
}
