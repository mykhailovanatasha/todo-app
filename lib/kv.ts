import { Redis } from "@upstash/redis";
import type { Task } from "@/lib/types";

// Vercel/Upstash інтеграція додає ці змінні автоматично
export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

type UserData = { tasks: Task[]; updatedAt: number };

const tasksKey = (userId: string) => `tasks:${userId}`;
const chatToUserKey = (chatId: number) => `chat:${chatId}`;
const userToChatKey = (userId: string) => `user:${userId}:chat`;
const LINKED_SET = "linked_users";

export async function getUserData(userId: string): Promise<UserData | null> {
  return (await redis.get<UserData>(tasksKey(userId))) ?? null;
}

export async function saveTasks(userId: string, tasks: Task[]): Promise<number> {
  const updatedAt = Date.now();
  await redis.set(tasksKey(userId), { tasks, updatedAt });
  return updatedAt;
}

// Прив'язуємо Telegram-чат до користувача застосунку (обидва напрямки + список)
export async function linkChat(userId: string, chatId: number): Promise<void> {
  await Promise.all([
    redis.set(chatToUserKey(chatId), userId),
    redis.set(userToChatKey(userId), chatId),
    redis.sadd(LINKED_SET, userId),
  ]);
}

export async function getChatForUser(userId: string): Promise<number | null> {
  return (await redis.get<number>(userToChatKey(userId))) ?? null;
}

export async function getUserForChat(chatId: number): Promise<string | null> {
  return (await redis.get<string>(chatToUserKey(chatId))) ?? null;
}

export async function getLinkedUsers(): Promise<string[]> {
  return (await redis.smembers(LINKED_SET)) ?? [];
}
