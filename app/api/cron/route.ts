import { redis, getLinkedUsers, getUserData, getChatForUser } from "@/lib/kv";
import {
  sendMessage,
  morningMessage,
  middayMessage,
  eveningMessage,
  currentSlot,
  localISODate,
} from "@/lib/telegram";

export const runtime = "nodejs";
export const maxDuration = 60;

type Slot = "morning" | "midday" | "evening";

// GET /api/cron?slot=morning|midday|evening  (або без slot — визначить за часом)
// Викликається GitHub Actions о 10:00 / 14:00 / 21:00 за Києвом.
export async function GET(req: Request) {
  const param = new URL(req.url).searchParams.get("slot") as Slot | null;
  const slot = param ?? currentSlot();
  if (!slot) return Response.json({ skipped: "поза розкладом" });

  const users = await getLinkedUsers();
  const today = localISODate();
  let sent = 0;

  for (const userId of users) {
    // антиспам: один слот — один раз на день на користувача
    const dedupeKey = `sent:${userId}:${slot}:${today}`;
    const already = await redis.set(dedupeKey, 1, { nx: true, ex: 172800 });
    if (already === null) continue; // вже надсилали сьогодні

    const chatId = await getChatForUser(userId);
    if (!chatId) continue;
    const data = await getUserData(userId);
    const tasks = data?.tasks ?? [];

    try {
      if (slot === "morning") {
        await sendMessage(chatId, morningMessage(tasks));
      } else if (slot === "midday") {
        const { text, buttons } = middayMessage(tasks);
        await sendMessage(chatId, text, buttons.length ? buttons : undefined);
      } else {
        const { text, buttons } = eveningMessage(tasks);
        await sendMessage(chatId, text, buttons.length ? buttons : undefined);
      }
      sent++;
    } catch {
      // якщо не вдалось — знімаємо позначку, спробуємо наступного разу
      await redis.del(dedupeKey);
    }
  }

  return Response.json({ slot, users: users.length, sent });
}
