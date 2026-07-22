"use client";

import { usePlanner, type Priority } from "@/lib/store";

const priorityStyles: Record<Priority, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-neutral-100 text-neutral-500",
};

const priorityLabels: Record<Priority, string> = {
  high: "Важливо",
  medium: "Середньо",
  low: "Не горить",
};

export default function InboxPage() {
  const { tasks, loaded } = usePlanner();
  const inbox = tasks.filter((t) => !t.today);

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="pb-3 text-2xl font-bold">Inbox</h1>

      {loaded && inbox.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-neutral-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-14 w-14">
            <path d="M22 12h-6l-2 3h-4l-2-3H2" />
            <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
          </svg>
          <p className="text-lg font-medium">Поки порожньо</p>
          <p className="max-w-60 text-sm">
            Задачі з&apos;являться тут, коли AI розбере твої записи з Capture
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {inbox.map((task) => (
            <li
              key={task.id}
              className="rounded-2xl border border-neutral-200 bg-white p-4"
            >
              <p className="text-base font-medium">{task.title}</p>
              <div className="flex flex-wrap gap-2 pt-2 text-xs">
                <span className={`rounded-full px-2.5 py-1 font-medium ${priorityStyles[task.priority]}`}>
                  {priorityLabels[task.priority]}
                </span>
                {task.time && (
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-neutral-600">
                    🕐 {task.time}
                  </span>
                )}
                {task.deadline && (
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-neutral-600">
                    📅 {task.deadline}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
