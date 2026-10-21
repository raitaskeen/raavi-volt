"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

/** Shows a toast for `?saved=<name>` once, then strips the param from the URL. */
export function FlashToast() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const saved = params.get("saved");

  useEffect(() => {
    if (!saved) return;
    toast("Product saved", { id: `saved:${saved}`, description: saved });
    const next = new URLSearchParams(params);
    next.delete("saved");
    router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [saved, params, pathname, router]);

  return null;
}
