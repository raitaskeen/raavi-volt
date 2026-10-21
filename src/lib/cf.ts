import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Cloudflare bindings (D1, R2, secrets) for the current request. */
export function cfEnv() {
  return getCloudflareContext().env;
}

export const db = () => cfEnv().DB;
export const media = () => cfEnv().MEDIA;
