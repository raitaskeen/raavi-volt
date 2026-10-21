/**
 * Detects a file's real type from its first bytes ("magic numbers"), so an
 * upload can't claim to be an image while containing HTML/script.
 */
export type SniffedType = "image/jpeg" | "image/png" | "image/webp" | "image/avif" | "application/pdf";

const ascii = (b: Uint8Array, start: number, end: number) => String.fromCharCode(...b.subarray(start, end));

export function sniffFileType(data: ArrayBuffer | Uint8Array): SniffedType | null {
  const b = data instanceof Uint8Array ? data : new Uint8Array(data);
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && ascii(b, 1, 4) === "PNG" && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return "image/png";
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP") return "image/webp";
  if (ascii(b, 4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(b, 8, 12))) return "image/avif";
  if (ascii(b, 0, 5) === "%PDF-") return "application/pdf";
  return null;
}

export const extensionFor: Record<SniffedType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "application/pdf": "pdf",
};
