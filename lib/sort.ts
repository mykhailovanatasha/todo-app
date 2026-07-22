import type { Task } from "@/lib/store";

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const;

// Для плану дня: спершу важливість, усередині — за часом
export function byPriorityThenTime(a: Task, b: Task): number {
  const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  if (p !== 0) return p;
  if (a.time && b.time) return a.time.localeCompare(b.time);
  if (a.time !== b.time) return a.time ? -1 : 1;
  return a.createdAt - b.createdAt;
}

// Для беклогу: спершу найближчий дедлайн (прострочені — нагорі), далі важливість
export function byDeadlineThenPriority(a: Task, b: Task): number {
  const ad = a.deadline ?? "￿";
  const bd = b.deadline ?? "￿";
  if (ad !== bd) return ad < bd ? -1 : 1;
  return byPriorityThenTime(a, b);
}
