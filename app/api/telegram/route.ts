import {
  linkChat,
  getUserForChat,
  getUserData,
  saveTasks,
} from "@/lib/kv";
import {
  sendMessage,
  answerCallback,
  webhookSecret,
  escapeHtml,
} from "@/lib/telegram";

export const runtime = "nodejs";

// Вебхук Telegram: приймає /start <userId> (прив'язка) і натискання кнопок «зроблено»
export async function POST(req: Request) {
  // захист: секретний токен у заголовку (Telegram надсилає його, бо ми задали при setWebhook)
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== webhookSecret()) {
    return new Response("forbidden", { status: 403 });
  }

  let update: any;
  try {
    update = await req.json();
  } catch {
    return new Response("ok");
  }

  // 1) Текстове повідомлення (зокрема /start <userId>)
  const message = update.message;
  if (message?.text) {
    const chatId = message.chat.id as number;
    const text = message.text.trim() as string;

    if (text.startsWith("/start")) {
      const parts = text.split(/\s+/);
      const userId = parts[1];
      if (userId) {
        await linkChat(userId, chatId);
        await sendMessage(
          chatId,
          "✅ <b>Готово!</b> Тепер я — Степан, твій помічник 👨‍🍳\n\nБуду писати щодня:\n☀️ <b>10:00</b> — план на день\n🕑 <b>14:00</b> — прогрес\n🌙 <b>21:00</b> — що ще лишилось",
        );
      } else {
        await sendMessage(
          chatId,
          "Привіт! Щоб підключити нагадування, відкрий застосунок і натисни «Підключити Telegram».",
        );
      }
    } else {
      await sendMessage(
        chatId,
        "Я нагадую про твої задачі 🙂 Керувати ними зручно в застосунку.",
      );
    }
    return new Response("ok");
  }

  // 2) Натискання inline-кнопки «✅ зроблено»
  const cb = update.callback_query;
  if (cb) {
    const chatId = cb.message?.chat?.id as number;
    const data = (cb.data as string) ?? "";
    await answerCallback(cb.id);

    if (data.startsWith("done:") && chatId) {
      const taskId = data.slice(5);
      const userId = await getUserForChat(chatId);
      if (userId) {
        const stored = await getUserData(userId);
        if (stored) {
          const tasks = stored.tasks.map((t) =>
            t.id === taskId ? { ...t, done: true, doneAt: Date.now() } : t,
          );
          await saveTasks(userId, tasks);
          const t = tasks.find((x) => x.id === taskId);
          if (t)
            await sendMessage(chatId, `✅ Зроблено: <b>${escapeHtml(t.title)}</b>`);
        }
      }
    }
    return new Response("ok");
  }

  return new Response("ok");
}
