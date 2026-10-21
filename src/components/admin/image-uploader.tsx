"use client";

import { useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { compressImage } from "@/lib/image-client";
import { cn, mediaUrl } from "@/lib/utils";

const MAX_IMAGES = 10;

/** Uploads to R2 via /admin/api/upload, keeps an ordered list of keys. First image = cover. */
export function ImageUploader({ value, onChange }: { value: string[]; onChange: (keys: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [dragging, setDragging] = useState(false);

  async function upload(files: FileList | File[]) {
    const list = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, MAX_IMAGES - value.length);
    if (!list.length) return;
    setUploading((n) => n + list.length);

    const keys: string[] = [];
    await Promise.all(
      list.map(async (file) => {
        try {
          const body = new FormData();
          body.set("file", await compressImage(file));
          const res = await fetch("/admin/api/upload", { method: "POST", body });
          const data = (await res.json()) as { key?: string; error?: string };
          if (!res.ok || !data.key) throw new Error(data.error ?? "Upload failed");
          keys.push(data.key);
        } catch (err) {
          toast("Upload failed", { description: `${file.name}: ${(err as Error).message}` });
        } finally {
          setUploading((n) => n - 1);
        }
      }),
    );
    if (keys.length) onChange([...value, ...keys]);
  }

  function move(i: number, dir: -1 | 1) {
    const next = [...value];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <AnimatePresence initial={false}>
          {value.map((key, i) => (
            <m.div
              key={key}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group relative aspect-square overflow-hidden rounded-lg border bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl(key)} alt={`Product image ${i + 1}`} className="size-full object-contain p-1.5" />
              {i === 0 && <span className="absolute top-1.5 left-1.5 rounded bg-ink px-1.5 py-0.5 text-[10px] font-medium text-white">Cover</span>}
              <button
                type="button"
                onClick={() => onChange(value.filter((k) => k !== key))}
                className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-ink text-white opacity-90 hover:opacity-100"
                aria-label={`Remove image ${i + 1}`}
              >
                <X className="size-3.5" />
              </button>
              <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="grid size-6 place-items-center rounded-full border bg-card disabled:invisible"
                  aria-label="Move image left"
                >
                  <ArrowLeft className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === value.length - 1}
                  className="grid size-6 place-items-center rounded-full border bg-card disabled:invisible"
                  aria-label="Move image right"
                >
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </m.div>
          ))}
        </AnimatePresence>
        {Array.from({ length: uploading }, (_, i) => (
          <div key={`up-${i}`} className="grid aspect-square place-items-center rounded-lg border border-dashed bg-paper">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ))}
        {value.length + uploading < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void upload(e.dataTransfer.files);
            }}
            className={cn(
              "grid aspect-square place-items-center rounded-lg border border-dashed bg-paper text-muted-foreground transition-colors hover:border-charcoal/50 hover:text-ink",
              dragging && "border-ink bg-accent text-ink",
            )}
          >
            <span className="grid justify-items-center gap-1.5 text-xs">
              <ImagePlus className="size-6" strokeWidth={1.5} />
              Add images
            </span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          if (e.target.files) void upload(e.target.files);
          e.target.value = "";
        }}
      />
      <p className="text-xs text-muted-foreground">
        Up to {MAX_IMAGES} images. Drag & drop or click. Images are auto-compressed to WebP (max 1600px). First image is the cover.
      </p>
    </div>
  );
}
