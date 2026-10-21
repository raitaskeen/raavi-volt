import { headers } from "next/headers";
import { cfEnv } from "@/lib/cf";

/** Returns false when the caller exceeded the limit. No-op if the binding is absent (local dev). */
export async function rateLimit(action: string) {
  const limiter = cfEnv().RATE_LIMITER;
  if (!limiter) return true;
  const h = await headers();
  const ip = h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  try {
    const { success } = await limiter.limit({ key: `${action}:${ip}` });
    return success;
  } catch {
    return true;
  }
}
