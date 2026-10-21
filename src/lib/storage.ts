/**
 * File storage for product images and payment proofs.
 *
 * Default: D1 (free plan has hard limits and needs no card, so it can never bill).
 * Files are stored as base64 text in ≤1.5 MB chunks because D1 rows cap at 2 MB.
 * If an R2 bucket is bound as MEDIA, it is used instead (scales further, but R2
 * usage above its free tier is billed).
 */
import { cfEnv, db } from "@/lib/cf";

const CHUNK_CHARS = 1_500_000;

export type StoredFile = { bytes: Uint8Array<ArrayBuffer>; contentType: string; etag: string };

function toBase64(bytes: Uint8Array) {
  let binary = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) binary += String.fromCharCode(...bytes.subarray(i, i + step));
  return btoa(binary);
}

function fromBase64(b64: string) {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export async function putFile(key: string, data: ArrayBuffer, contentType: string) {
  const r2 = cfEnv().MEDIA;
  if (r2) {
    await r2.put(key, data, { httpMetadata: { contentType, cacheControl: "public, max-age=31536000, immutable" } });
    return;
  }
  const b64 = toBase64(new Uint8Array(data));
  const parts: string[] = [];
  for (let i = 0; i < b64.length; i += CHUNK_CHARS) parts.push(b64.slice(i, i + CHUNK_CHARS));
  const d = db();
  await d.batch([
    d.prepare("DELETE FROM file_chunks WHERE key = ?").bind(key),
    ...parts.map((p, idx) => d.prepare("INSERT INTO file_chunks (key, idx, data) VALUES (?, ?, ?)").bind(key, idx, p)),
    d
      .prepare("INSERT OR REPLACE INTO files (key, content_type, size, chunks) VALUES (?, ?, ?, ?)")
      .bind(key, contentType, data.byteLength, parts.length),
  ]);
}

export async function getFile(key: string): Promise<StoredFile | null> {
  const r2 = cfEnv().MEDIA;
  if (r2) {
    const obj = await r2.get(key);
    if (!obj) return null;
    return { bytes: new Uint8Array(await obj.arrayBuffer()), contentType: obj.httpMetadata?.contentType ?? "application/octet-stream", etag: obj.httpEtag };
  }
  const d = db();
  const [meta, chunks] = await d.batch([
    d.prepare("SELECT content_type, size FROM files WHERE key = ?").bind(key),
    d.prepare("SELECT data FROM file_chunks WHERE key = ? ORDER BY idx").bind(key),
  ]);
  const m = meta.results[0] as { content_type: string; size: number } | undefined;
  if (!m) return null;
  const b64 = (chunks.results as { data: string }[]).map((c) => c.data).join("");
  // Keys contain a random UUID and never change, so the key itself is a stable ETag.
  return { bytes: fromBase64(b64), contentType: m.content_type, etag: `"${key.split("/").pop()}"` };
}

export async function deleteFiles(keys: string[]) {
  if (!keys.length) return;
  const r2 = cfEnv().MEDIA;
  if (r2) {
    await r2.delete(keys);
    return;
  }
  const d = db();
  await d.batch(
    keys.flatMap((k) => [d.prepare("DELETE FROM file_chunks WHERE key = ?").bind(k), d.prepare("DELETE FROM files WHERE key = ?").bind(k)]),
  );
}
