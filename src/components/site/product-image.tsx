import Image from "next/image";
import { CategoryIcon } from "@/components/site/category-icon";
import { cn, mediaUrl } from "@/lib/utils";

/** Product photo, or a clean category placeholder until one is uploaded. */
export function ProductImage({
  src,
  alt,
  category,
  brand,
  priority,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw",
  className,
}: {
  src?: string | null;
  alt: string;
  category: string;
  brand?: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative aspect-square overflow-hidden bg-white", className)}>
      {src ? (
        <Image
          src={mediaUrl(src)}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-contain p-[6%] transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_45%,#ffffff_0%,var(--paper)_70%)]" aria-hidden>
          <span className="absolute size-[46%] rounded-full bg-volt/35 blur-2xl transition-transform duration-500 group-hover:scale-125" />
          <CategoryIcon
            category={category}
            strokeWidth={1}
            className="relative size-[38%] text-ink transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-3"
          />
        </div>
      )}
    </div>
  );
}
