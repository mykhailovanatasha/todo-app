export function localISODate(offsetDays = 0): string {
  return new Date(Date.now() + offsetDays * 86_400_000).toLocaleDateString("sv-SE");
}

export type InboxGroup = "overdue" | "today" | "week" | "later" | "someday";

// Визначаємо, у яку групу Inbox падає задача за її дедлайном
export function inboxGroup(deadline?: string): InboxGroup {
  if (!deadline) return "someday";
  const today = localISODate();
  if (deadline < today) return "overdue";
  if (deadline === today) return "today";
  if (deadline <= localISODate(7)) return "week";
  return "later";
}

export function formatDeadline(iso: string): {
  label: string;
  overdue: boolean;
  isToday: boolean;
} {
  if (iso === localISODate())
    return { label: "сьогодні", overdue: false, isToday: true };
  if (iso === localISODate(1))
    return { label: "завтра", overdue: false, isToday: false };
  const date = new Date(`${iso}T00:00:00`);
  const label = date.toLocaleDateString("uk-UA", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
  return { label, overdue: iso < localISODate(), isToday: false };
}
