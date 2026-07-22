import { setWebhook } from "@/lib/telegram";

export const runtime = "nodejs";

// Реєструє вебхук бота. Відкрити один раз у браузері після деплою.
export async function GET(req: Request) {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return Response.json({ error: "TELEGRAM_BOT_TOKEN не заданий" }, { status: 500 });
  }
  const origin = new URL(req.url).origin;
  const result = await setWebhook(`${origin}/api/telegram`);
  return Response.json({ ok: true, webhook: `${origin}/api/telegram`, telegram: result });
}
