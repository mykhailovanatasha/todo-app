import { getUserData, saveTasks } from "@/lib/kv";
import type { Task } from "@/lib/types";

export const runtime = "nodejs";

// GET /api/tasks?userId=... → { tasks, updatedAt } | { tasks: null }
export async function GET(req: Request) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return Response.json({ error: "userId required" }, { status: 400 });

  const data = await getUserData(userId);
  if (!data) return Response.json({ tasks: null, updatedAt: 0 });
  return Response.json(data);
}

// POST /api/tasks  { userId, tasks } → { updatedAt }
export async function POST(req: Request) {
  let body: { userId?: string; tasks?: Task[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  const { userId, tasks } = body;
  if (!userId || !Array.isArray(tasks)) {
    return Response.json({ error: "userId and tasks required" }, { status: 400 });
  }
  const updatedAt = await saveTasks(userId, tasks);
  return Response.json({ updatedAt });
}
