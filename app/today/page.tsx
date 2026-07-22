"use client";

import { useState } from "react";
import Link from "next/link";
import { usePlanner, type Priority } from "@/lib/store";
import { byPriorityThenTime } from "@/lib/sort";

const priorityBorder: Record<Priority, string> = {
  high: "border-l-red-400",
  medium: "border-l-amber-400",
  low: "border-l-neutral-200",
};

export default function TodayPage() {
  const { tasks, toggleDone, toggleToday, loaded } = usePlanner();
  const [copied, setCopied] = useState(false);

  const todayTasks = tasks.filter((t) => t.today && !t.archived);
  const active = todayTasks.filter((t) => !t.done).sort(byPriorityThenTime);
  const doneList = todayTasks
    .filter((t) => t.done)
    .sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));
  const archivedCount = tasks.filter((t) => t.archived).length;

  async function sharePlan() {
    const lines = active.map(
      (t) => `• ${t.title}${t.time ? ` — ${t.time}` : ""}`,
    );
    const text = `📋 Мій план на сьогодні:\n${lines.join("\n")}`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // користувач закрив вікно шерингу
      }
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function renderTask(task: (typeof tasks)[number], dimmed: boolean) {
    return (
      <li key={task.id} className="relative">
        <button
          onClick={() => toggleToday(task.id)}
          aria-label="Повернути в Inbox"
          className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full text-neutral-300 active:bg-neutral-100 active:text-neutral-500"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M9 14L4 9l5-5" />
            <path d="M4 9h10a6 6 0 016 6v1" />
          </svg>
        </button>
        <button
          onClick={() => toggleDone(task.id)}
          className={`flex min-h-16 w-full items-center gap-3 rounded-2xl border border-l-4 border-neutral-200 bg-white p-4 pr-11 text-left active:scale-[0.99] ${
            dimmed ? "border-l-neutral-200 opacity-60" : priorityBorder[task.priority]
          }`}
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
              <span className="pl-2 text-sm text-neutral-400">{task.time}</span>
            )}
          </span>
        </button>
      </li>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between pb-3">
        <h1 className="text-2xl font-bold">Today</h1>
        <div className="flex items-center gap-2">
          {todayTasks.length > 0 && (
            <span className="text-sm text-neutral-400">
              {doneList.length}/{todayTasks.length}
            </span>
          )}
          {active.length > 0 && (
            <button
              onClick={sharePlan}
              aria-label="Поділитися планом"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent active:scale-95"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                <path d="M16 6l-4-4-4 4" />
                <path d="M12 2v13" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {copied && (
        <p className="pb-2 text-sm font-medium text-accent">
          План скопійовано — встав у будь-який чат ✓
        </p>
      )}

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
