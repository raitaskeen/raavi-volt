import { after } from "next/server";
import { cfEnv } from "@/lib/cf";
import { handleWebhook, type WebhookPayload } from "@/lib/whatsapp-bot";

const enc = new TextEncoder();

/** Meta's one-time verification handshake when you register the callback URL. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = cfEnv().WHATSAPP_VERIFY_TOKEN;
  if (token && url.searchParams.get("hub.mode") === "subscribe" && url.searchParams.get("hub.verify_token") === token) {
    return new Response(url.searchParams.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

async function validSignature(raw: string, header: string | null, secret: string) {
  if (!header?.startsWith("sha256=")) return false;
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(raw)));
  const expected = Array.from(digest, (b) => b.toString(16).padStart(2, "0")).join("");
  const given = header.slice(7);
  if (given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}

/** Incoming messages and delivery receipts. Acknowledge fast; work happens after the response. */
export async function POST(request: Request) {
  const secret = cfEnv().WHATSAPP_APP_SECRET;
  if (!secret) return new Response("Webhook not configured", { status: 503 });

  const raw = await request.text();
  if (!(await validSignature(raw, request.headers.get("x-hub-signature-256"), secret))) {
    return new Response("Invalid signature", { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(raw) as WebhookPayload;
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }
  if (payload.object !== "whatsapp_business_account") return new Response("Ignored", { status: 200 });

  after(() => handleWebhook(payload));
  return new Response("OK", { status: 200 });
}
