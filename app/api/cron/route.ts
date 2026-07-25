import {
  redis,
  getLinkedUsers,
  getUserData,
  getChatForUser,
  getUserForChat,
  getNotifyPrefs,
} from "@/lib/kv";
import {
  sendMessage,
  morningMessage,
  middayMessage,
  eveningMessage,
  kyivHour,
  localISODate,
} from "@/lib/telegram";

export const runtime = "nodejs";
export const maxDuration = 60;

type Slot = "morning" | "midday" | "evening";
const SLOTS: Slot[] = ["morning", "midday", "evening"];

// Викликається GitHub Actions щопівгодини. Для кожного користувача перевіряє
// його власні години нагадувань і шле те, чий час настав. ?slot=... — для тесту.
export async function GET(req: Request) {
  const forced = new URL(req.url).searchParams.get("slot") as Slot | null;
  const hour = kyivHour();
  const users = await getLinkedUsers();
  const today = localISODate();
  let sent = 0;

  for (const userId of users) {
    const chatId = await getChatForUser(userId);
    if (!chatId) continue;

    // пропускаємо застарілі прив'язки: чат уже належить іншому профілю
    if ((await getUserForChat(chatId)) !== userId) continue;

    const prefs = await getNotifyPrefs(userId);
    const due: Slot[] = forced
      ? [forced]
      : SLOTS.filter((s) => prefs[s] === hour);
    if (due.length === 0) continue;

    const data = await getUserData(userId);
    const tasks = data?.tasks ?? [];

    for (const slot of due) {
      // антиспам: один слот — один раз на день на користувача
      const dedupeKey = `sent:${userId}:${slot}:${today}`;
      const already = await redis.set(dedupeKey, 1, { nx: true, ex: 172800 });
      if (already === null) continue;

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
        await redis.del(dedupeKey);
      }
    }
  }

  return Response.json({ hour, users: users.length, sent });
}
