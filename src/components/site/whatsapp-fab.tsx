"use client";

import { m } from "motion/react";
import { usePathname } from "next/navigation";
import { WhatsAppIcon } from "@/components/site/icons";
import { store } from "@/config/store";

/** Floating "Chat on WhatsApp" — the default support channel for Pakistani shoppers. */
export function WhatsAppFab() {
  const pathname = usePathname();
  if (pathname.startsWith("/checkout")) return null;
  const text = encodeURIComponent(`Assalam o Alaikum ${store.name}! I have a question.`);

  return (
    <m.a
      href={`https://wa.me/${store.contact.whatsapp}?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      initial={{ opacity: 0, scale: 0.6, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 1.2, type: "spring", stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      className={`group fixed right-4 ${pathname.startsWith("/product/") ? "hidden lg:flex" : "flex"} bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 h-12 items-center gap-2 rounded-full bg-matte pr-4 pl-3.5 text-white shadow-[0_10px_30px_-8px_rgb(0_0_0/0.5)] ring-2 ring-volt/70 sm:right-6 sm:bottom-6`}
    >
      <WhatsAppIcon className="size-5" />
      <span className="text-sm font-medium">Chat</span>
    </m.a>
  );
}
