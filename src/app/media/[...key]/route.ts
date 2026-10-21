import { getFile } from "@/lib/storage";

/**
 * Serves public product images. Keys are random UUIDs, so responses are
 * immutable: browsers cache them for a year, and on a custom domain the
 * Workers Cache API serves repeats without touching D1.
 */
export async function GET(request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.join("/");
  // Only product images are public — payment proofs stay private.
  if (!/^products\/[\w-]+\.(webp|jpe?g|png|avif)$/.test(key)) return new Response("Not found", { status: 404 });

  const cache = (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default;
  const cached = await cache?.match(request).catch(() => undefined);
  if (cached) return cached;

  const file = await getFile(key);
  if (!file) return new Response("Not found", { status: 404 });

  if (request.headers.get("if-none-match") === file.etag) {
    return new Response(null, { status: 304, headers: { ETag: file.etag, "Cache-Control": "public, max-age=31536000, immutable" } });
  }

  const response = new Response(file.bytes, {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: file.etag,
    },
  });
  await cache?.put(request, response.clone()).catch(() => undefined);
  return response;
}
