import { getChatForUser } from "@/lib/kv";

export const runtime = "nodejs";

// GET /api/telegram/status?userId=... → { linked: boolean }
export async function GET(req: Request) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return Response.json({ error: "userId required" }, { status: 400 });
  const chatId = await getChatForUser(userId);
  return Response.json({ linked: chatId != null });
}
