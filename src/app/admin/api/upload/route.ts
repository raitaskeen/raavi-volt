import { isAdmin } from "@/lib/auth";
import { putFile } from "@/lib/storage";

const TYPES: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/avif": "avif",
};
const MAX_BYTES = 6 * 1024 * 1024;

/** Admin-only image upload → R2. Returns the object key to store on the product. */
export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file uploaded" }, { status: 400 });

  const ext = TYPES[file.type];
  if (!ext) return Response.json({ error: "Use JPG, PNG, WebP or AVIF images" }, { status: 415 });
  if (file.size > MAX_BYTES) return Response.json({ error: "Image must be under 6 MB" }, { status: 413 });

  const key = `products/${crypto.randomUUID()}.${ext}`;
  await putFile(key, await file.arrayBuffer(), file.type);
  return Response.json({ key });
}
