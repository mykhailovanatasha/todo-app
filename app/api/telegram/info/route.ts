import { getWebhookInfo } from "@/lib/telegram";
import { getLinkedUsers, getUserData, getChatForUser } from "@/lib/kv";
import { webhookSecret } from "@/lib/telegram";

export const runtime = "nodejs";

// Діагностика. Відкривати з ?key=<webhookSecret>. Тимчасовий ендпоінт.
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (key !== webhookSecret()) {
    return new Response("forbidden", { status: 403 });
  }

  const webhook = await getWebhookInfo();
  const users = await getLinkedUsers();
  const linked = [];
  for (const userId of users) {
    const chatId = await getChatForUser(userId);
    const data = await getUserData(userId);
    linked.push({
      userId,
      chatId,
      taskCount: data?.tasks.length ?? 0,
      updatedAt: data?.updatedAt ?? 0,
      tasks: (data?.tasks ?? []).map((t) => ({
        title: t.title,
        today: t.today,
        done: t.done,
        archived: t.archived ?? false,
      })),
    });
  }

  return Response.json({ webhook, linkedUsers: linked });
}
