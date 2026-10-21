import { isAdmin } from "@/lib/auth";
import { putFile } from "@/lib/storage";
import { extensionFor, sniffFileType } from "@/lib/file-type";

const IMAGE_TYPES = new Set(["image/webp", "image/jpeg", "image/png", "image/avif"]);
const MAX_BYTES = 6 * 1024 * 1024;

/** Admin-only image upload. Returns the storage key to save on the product. */
export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file uploaded" }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "Image must be under 6 MB" }, { status: 413 });

  // Trust the file's bytes, not the browser-declared type.
  const bytes = await file.arrayBuffer();
  const type = sniffFileType(bytes);
  if (!type || !IMAGE_TYPES.has(type)) return Response.json({ error: "Use JPG, PNG, WebP or AVIF images" }, { status: 415 });

  const key = `products/${crypto.randomUUID()}.${extensionFor[type]}`;
  await putFile(key, bytes, type);
  return Response.json({ key });
}
