import { createHash } from "crypto";
import type { Task } from "@/lib/types";
import { localISODate } from "@/lib/dates";

const API = (method: string) =>
  `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`;

// Секрет вебхука рахуємо з токена — окрема змінна не потрібна
export function webhookSecret(): string {
  return createHash("sha256")
    .update(process.env.TELEGRAM_BOT_TOKEN ?? "")
    .digest("hex")
    .slice(0, 40);
}

export async function setWebhook(url: string): Promise<unknown> {
  const res = await fetch(API("setWebhook"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      secret_token: webhookSecret(),
      allowed_updates: ["message", "callback_query"],
    }),
  });
  return res.json();
}

type InlineButton = { text: string; callback_data: string };

export async function sendMessage(
  chatId: number,
  text: string,
  buttons?: InlineButton[][],
): Promise<void> {
  await fetch(API("sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup: buttons ? { inline_keyboard: buttons } : undefined,
    }),
  });
}

export async function answerCallback(callbackId: string): Promise<void> {
  await fetch(API("answerCallbackQuery"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackId }),
  });
}

const PRIORITY_ICON: Record<Task["priority"], string> = {
  high: "🔴",
  medium: "🟡",
  low: "⚪",
};

// Екранування для parse_mode: HTML (щоб символи < > & не ламали повідомлення)
export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function todayList(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.today && !t.archived);
}

function line(t: Task): string {
  const time = t.time ? ` <b>${t.time}</b>` : "";
  return `${PRIORITY_ICON[t.priority]} ${escapeHtml(t.title)}${time}`;
}

// 10:00 — план на день
export function morningMessage(tasks: Task[]): string {
  const list = todayList(tasks).filter((t) => !t.done);
  if (list.length === 0) {
    return "☀️ <b>Доброго ранку!</b>\n\nНа сьогодні задач ще немає. Закинь думки Степану в застосунку 👨‍🍳";
  }
  const body = list.map(line).join("\n");
  return `☀️ <b>Доброго ранку!</b>\n\nОсь твій план на сьогодні (${list.length}):\n\n${body}`;
}

// 14:00 — прогрес + кнопки «зроблено»
export function middayMessage(tasks: Task[]): {
  text: string;
  buttons: InlineButton[][];
} {
  const list = todayList(tasks);
  const done = list.filter((t) => t.done);
  const left = list.filter((t) => !t.done);

  if (list.length === 0) {
    return {
      text: "🕑 <b>Полудень.</b> На сьогодні задач немає.",
      buttons: [],
    };
  }

  let text = `🕑 <b>Як просувається день?</b>\n\nЗроблено: ${done.length} з ${list.length}\n\n`;
  if (left.length > 0) {
    text += `<b>Ще лишилось:</b>\n${left.map(line).join("\n")}\n\nВідмічай виконане кнопками нижче 👇`;
  } else {
    text += "🎉 Усе виконано! Ти неймовірний(а).";
  }

  // по кнопці на кожну невиконану задачу
  const buttons: InlineButton[][] = left.map((t) => [
    { text: `✅ ${t.title}`.slice(0, 60), callback_data: `done:${t.id}` },
  ]);

  return { text, buttons };
}

// 21:00 — що ще лишилось
export function eveningMessage(tasks: Task[]): {
  text: string;
  buttons: InlineButton[][];
} {
  const list = todayList(tasks);
  const left = list.filter((t) => !t.done);

  if (list.length === 0) {
    return { text: "🌙 <b>Добраніч!</b> Сьогодні задач не було.", buttons: [] };
  }
  if (left.length === 0) {
    return {
      text: "🌙 <b>Вечір.</b>\n\nВсі задачі дня закрито 🎉 Степан пишається тобою 👨‍🍳",
      buttons: [],
    };
  }

  const text = `🌙 <b>Вечір.</b>\n\nЩе не закрито (${left.length}):\n${left
    .map(line)
    .join("\n")}\n\nМожеш відмітити зараз 👇`;
  const buttons: InlineButton[][] = left.map((t) => [
    { text: `✅ ${t.title}`.slice(0, 60), callback_data: `done:${t.id}` },
  ]);

  return { text, buttons };
}

// Визначаємо слот за київською годиною (для GitHub Actions cron)
export function currentSlot(): "morning" | "midday" | "evening" | null {
  const hour = Number(
    new Date().toLocaleString("en-US", {
      timeZone: "Europe/Kyiv",
      hour: "2-digit",
      hour12: false,
    }),
  );
  if (hour >= 9 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "midday";
  if (hour >= 17 && hour < 23) return "evening";
  return null;
}

export { localISODate };
