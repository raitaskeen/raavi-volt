import { db } from "@/lib/cf";

/** Uptime check: confirms the Worker and D1 respond. Point a free monitor (e.g. UptimeRobot) here. */
export async function GET() {
  const started = Date.now();
  try {
    await db().prepare("SELECT 1").first();
    return Response.json({ ok: true, db: "ok", ms: Date.now() - started }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false, db: "unreachable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
