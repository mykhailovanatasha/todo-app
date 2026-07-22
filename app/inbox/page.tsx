"use client";

import { usePlanner, type Priority } from "@/lib/store";
import { formatDeadline } from "@/lib/dates";
import { byDeadlineThenPriority } from "@/lib/sort";

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

const priorityBorder: Record<Priority, string> = {
  high: "border-l-red-400",
  medium: "border-l-amber-400",
  low: "border-l-neutral-200",
};

export default function InboxPage() {
  const { tasks, toggleToday, removeTask, loaded } = usePlanner();
  const inbox = tasks
    .filter((t) => !t.today && !t.archived)
    .sort(byDeadlineThenPriority);

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
            Надиктуй або запиши думки в Capture — AI розкладе їх на задачі тут
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {inbox.map((task) => (
            <li
              key={task.id}
              className={`rounded-2xl border border-l-4 border-neutral-200 bg-white p-4 ${priorityBorder[task.priority]}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-base font-medium">{task.title}</p>
                <button
                  onClick={() => removeTask(task.id)}
                  aria-label="Видалити задачу"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-300 active:bg-neutral-100 active:text-neutral-500"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
                <span className={`rounded-full px-2.5 py-1 font-medium ${priorityStyles[task.priority]}`}>
                  {priorityLabels[task.priority]}
                </span>
                {task.time && (
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-neutral-600">
                    🕐 {task.time}
                  </span>
                )}
                {task.deadline &&
                  (() => {
                    const d = formatDeadline(task.deadline);
                    const badgeClass = d.overdue
                      ? "bg-red-500 font-medium text-white"
                      : d.isToday
                        ? "bg-red-100 font-medium text-red-700"
                        : "bg-neutral-100 text-neutral-600";
                    return (
                      <span className={`rounded-full px-2.5 py-1 ${badgeClass}`}>
                        📅 {d.overdue ? `прострочено · ${d.label}` : d.label}
                      </span>
                    );
                  })()}
              </div>
              <button
                onClick={() => toggleToday(task.id)}
                className="mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-accent-soft text-sm font-semibold text-accent active:scale-[0.98]"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                На сьогодні
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
