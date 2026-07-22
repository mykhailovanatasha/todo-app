export function localISODate(offsetDays = 0): string {
  return new Date(Date.now() + offsetDays * 86_400_000).toLocaleDateString("sv-SE");
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
