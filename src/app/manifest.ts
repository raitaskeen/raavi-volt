import type { MetadataRoute } from "next";
import { store } from "@/config/store";

/** Installable app (Android, ChromeOS, Windows / macOS via Chrome & Edge, iOS Add to Home Screen). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `${store.name} — ${store.tagline}`,
    short_name: store.name,
    description: store.description,
    start_url: "/?source=app",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#f6f5f1",
    theme_color: "#151515",
    lang: "en-PK",
    dir: "ltr",
    categories: ["shopping", "lifestyle"],
    prefer_related_applications: false,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: [
      { name: "Shop all", short_name: "Shop", url: "/shop?source=app", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Today's deals", short_name: "Deals", url: "/shop?sale=1&source=app", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Track my order", short_name: "Track", url: "/track?source=app", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "My cart", short_name: "Cart", url: "/cart?source=app", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
