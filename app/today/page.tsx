"use client";

import { usePlanner } from "@/lib/store";

export default function TodayPage() {
  const { tasks, toggleDone, loaded } = usePlanner();
  const today = tasks.filter((t) => t.today);
  const doneCount = today.filter((t) => t.done).length;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-baseline justify-between pb-3">
        <h1 className="text-2xl font-bold">Today</h1>
        {today.length > 0 && (
          <span className="text-sm text-neutral-400">
            {doneCount}/{today.length}
          </span>
        )}
      </div>

      {loaded && today.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-neutral-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-14 w-14">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
          <p className="text-lg font-medium">План на сьогодні порожній</p>
          <p className="max-w-60 text-sm">
            AI сформує чекліст дня із задач у твоєму беклозі
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {today.map((task) => (
            <li key={task.id}>
              <button
                onClick={() => toggleDone(task.id)}
                className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-left active:scale-[0.99]"
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    task.done
                      ? "border-accent bg-accent text-white"
                      : "border-neutral-300"
                  }`}
                >
                  {task.done && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </span>
                <span
                  className={`text-base ${
                    task.done ? "text-neutral-400 line-through" : ""
                  }`}
                >
                  {task.title}
                  {task.time && (
                    <span className="pl-2 text-sm text-neutral-400">
                      {task.time}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
