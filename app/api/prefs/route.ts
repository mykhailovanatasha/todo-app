import { getNotifyPrefs, saveNotifyPrefs, type NotifyPrefs } from "@/lib/kv";

export const runtime = "nodejs";

// GET /api/prefs?userId=... → NotifyPrefs
export async function GET(req: Request) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return Response.json({ error: "userId required" }, { status: 400 });
  return Response.json(await getNotifyPrefs(userId));
}

// POST /api/prefs  { userId, prefs }
export async function POST(req: Request) {
  let body: { userId?: string; prefs?: NotifyPrefs };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  const { userId, prefs } = body;
  if (!userId || !prefs) {
    return Response.json({ error: "userId and prefs required" }, { status: 400 });
  }
  const clamp = (v: number | null) =>
    v === null ? null : Math.max(0, Math.min(23, Math.floor(v)));
  await saveNotifyPrefs(userId, {
    morning: clamp(prefs.morning),
    midday: clamp(prefs.midday),
    evening: clamp(prefs.evening),
  });
  return Response.json({ ok: true });
}
