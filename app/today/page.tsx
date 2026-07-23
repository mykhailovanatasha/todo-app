"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePlanner, type Priority } from "@/lib/store";
import { byPriorityThenTime } from "@/lib/sort";
import Celebration from "@/components/Celebration";

const priorityBorder: Record<Priority, string> = {
  high: "border-l-red-400",
  medium: "border-l-amber-400",
  low: "border-l-neutral-200",
};

export default function TodayPage() {
  const { tasks, toggleDone, toggleToday, loaded } = usePlanner();
  const [celebrate, setCelebrate] = useState(false);
  const prevAllDone = useRef(true);

  const todayTasks = tasks.filter((t) => t.today && !t.archived);
  const active = todayTasks.filter((t) => !t.done).sort(byPriorityThenTime);
  const doneList = todayTasks
    .filter((t) => t.done)
    .sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));
  const archivedCount = tasks.filter((t) => t.archived).length;

  // Святкуємо лише в момент, коли остання активна задача дня стала виконаною
  const allDone = todayTasks.length > 0 && active.length === 0;
  useEffect(() => {
    if (allDone && !prevAllDone.current) setCelebrate(true);
    prevAllDone.current = allDone;
  }, [allDone]);

  function renderTask(task: (typeof tasks)[number], dimmed: boolean) {
    return (
      <li key={task.id} className="relative">
        <button
          onClick={() => toggleToday(task.id)}
          aria-label="Повернути в Inbox"
          className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-neutral-400 active:bg-neutral-100 active:text-neutral-600"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
            <path d="M9 14L4 9l5-5" />
            <path d="M4 9h10a6 6 0 016 6v1" />
          </svg>
          В Inbox
        </button>
        <button
          onClick={() => toggleDone(task.id)}
          className={`flex min-h-16 w-full items-center gap-3 rounded-2xl border border-l-4 border-neutral-200 bg-white p-4 pt-9 text-left active:scale-[0.99] ${
            dimmed ? "border-l-neutral-200 opacity-60" : priorityBorder[task.priority]
          }`}
        >
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
              task.done
                ? "border-green-500 bg-green-500 text-white"
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
              <span className="pl-2 text-sm text-neutral-400">{task.time}</span>
            )}
          </span>
        </button>
      </li>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {celebrate && <Celebration onClose={() => setCelebrate(false)} />}
      <div className="pb-4">
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-bold">Today</h1>
          {todayTasks.length > 0 && (
            <span className="text-sm font-medium text-neutral-500">
              {doneList.length}/{todayTasks.length} виконано
            </span>
          )}
        </div>
        {todayTasks.length > 0 && (
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500"
              style={{
                width: `${Math.round((doneList.length / todayTasks.length) * 100)}%`,
              }}
            />
          </div>
        )}
      </div>

      {loaded && todayTasks.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-neutral-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-14 w-14">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
          <p className="text-lg font-medium">План на сьогодні порожній</p>
          <p className="max-w-60 text-sm">
            Надиктуй думки в Capture або додай задачі з Inbox
          </p>
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {active.map((t) => renderTask(t, false))}
          </ul>

          {doneList.length > 0 && (
            <>
              <p className="pb-2 pt-6 text-sm font-medium text-neutral-400">
                Виконано · {doneList.length}
              </p>
              <ul className="flex flex-col gap-2">
                {doneList.map((t) => renderTask(t, true))}
              </ul>
            </>
          )}
        </>
      )}

      <Link
        href="/archive"
        className="mt-auto flex items-center justify-center gap-2 py-6 text-sm text-neutral-400 active:text-neutral-600"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <rect x="3" y="4" width="18" height="4" rx="1" />
          <path d="M5 8v11a1 1 0 001 1h12a1 1 0 001-1V8" />
          <path d="M10 12h4" />
        </svg>
        Архів виконаного{archivedCount > 0 ? ` (${archivedCount})` : ""}
      </Link>
    </div>
  );
}
