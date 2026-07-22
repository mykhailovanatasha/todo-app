import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `Ти — парсер задач для українськомовного застосунку-планера.
Користувач диктує або пише «потік свідомості»: справи, ідеї, нагадування впереміш.
Твоє завдання — розбити цей текст на окремі, чіткі задачі.

Правила:
- Кожна задача — коротке формулювання: дієслово + об'єкт («Купити молоко», «Подзвонити клієнту»).
- priority: "high" — терміново/важливо/дедлайн близько; "medium" — звичайні справи з часом або датою; "low" — «колись», «не забути б», ідеї.
- time: час у форматі HH:MM, лише якщо в тексті згаданий конкретний час для цієї задачі. Інакше null.
- deadline: дата у форматі YYYY-MM-DD, лише якщо згадана («завтра», «до п'ятниці», «15 числа»). Обчислюй від сьогоднішньої дати, вказаної в повідомленні. Інакше null.
- Не вигадуй задач, яких немає в тексті. Не дублюй. Ігноруй слова-паразити.`;

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    tasks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Коротка назва задачі українською",
          },
          priority: { type: "string", enum: ["low", "medium", "high"] },
          time: {
            anyOf: [{ type: "string" }, { type: "null" }],
            description: "Час HH:MM або null",
          },
          deadline: {
            anyOf: [{ type: "string" }, { type: "null" }],
            description: "Дата YYYY-MM-DD або null",
          },
        },
        required: ["title", "priority", "time", "deadline"],
        additionalProperties: false,
      },
    },
  },
  required: ["tasks"],
  additionalProperties: false,
};

export async function POST(req: Request) {
  let text: unknown;
  try {
    ({ text } = await req.json());
  } catch {
    return Response.json({ error: "Невалідний запит" }, { status: 400 });
  }
  if (typeof text !== "string" || !text.trim()) {
    return Response.json({ error: "Порожній текст" }, { status: 400 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "AI не налаштований: додай ANTHROPIC_API_KEY у .env.local (локально) та в налаштування Vercel" },
      { status: 500 },
    );
  }

  const client = new Anthropic();

  const today = new Date();
  const dateStr = today.toLocaleDateString("uk-UA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
    timeZone: "Europe/Kyiv",
  });
  const isoDate = today.toLocaleDateString("sv-SE", { timeZone: "Europe/Kyiv" });

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: SYSTEM_PROMPT,
      output_config: {
        format: { type: "json_schema", schema: OUTPUT_SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: `Сьогодні: ${dateStr} (${isoDate}).\n\nЗапис користувача:\n${text.trim()}`,
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return Response.json(
        { error: "AI відмовився обробляти цей текст" },
        { status: 422 },
      );
    }

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock) {
      return Response.json({ error: "Порожня відповідь AI" }, { status: 502 });
    }

    return Response.json(JSON.parse(textBlock.text));
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return Response.json(
        { error: "Невірний API-ключ Anthropic — перевір ANTHROPIC_API_KEY" },
        { status: 500 },
      );
    }
    if (error instanceof Anthropic.RateLimitError) {
      return Response.json(
        { error: "Забагато запитів — спробуй за хвилину" },
        { status: 429 },
      );
    }
    if (error instanceof Anthropic.APIError) {
      if (error.message.includes("credit balance")) {
        return Response.json(
          { error: "На акаунті Anthropic закінчились кредити — поповни баланс у console.anthropic.com → Plans & Billing" },
          { status: 402 },
        );
      }
      return Response.json(
        { error: `Помилка AI (${error.status})` },
        { status: 502 },
      );
    }
    return Response.json({ error: "Невідома помилка сервера" }, { status: 500 });
  }
}
