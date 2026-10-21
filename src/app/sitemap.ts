import type { MetadataRoute } from "next";
import { categories, store } from "@/config/store";
import { listSlugs } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await listSlugs();
  return [
    { url: store.url, changeFrequency: "daily", priority: 1 },
    { url: `${store.url}/shop`, changeFrequency: "daily", priority: 0.9 },
    ...["/about", "/contact", "/shipping-returns", "/track", "/privacy", "/terms"].map((p) => ({ url: `${store.url}${p}`, changeFrequency: "monthly" as const, priority: 0.3 })),
    ...categories.map((c) => ({ url: `${store.url}/shop?category=${c.slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...products.map((p) => ({
      url: `${store.url}/product/${p.slug}`,
      lastModified: new Date(p.updated_at * 1000),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
