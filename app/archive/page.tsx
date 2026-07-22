"use client";

import Link from "next/link";
import { usePlanner } from "@/lib/store";

export default function ArchivePage() {
  const { tasks, clearArchive, loaded } = usePlanner();
  const archived = tasks
    .filter((t) => t.archived)
    .sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Link
            href="/today"
            aria-label="Назад до Today"
            className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-400 active:bg-neutral-100"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold">Архів</h1>
        </div>
        {archived.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm("Видалити всі задачі з архіву назавжди?")) {
                clearArchive();
              }
            }}
            className="rounded-full px-3 py-2 text-sm font-medium text-red-500 active:bg-red-50"
          >
            Очистити
          </button>
        )}
      </div>

      {loaded && archived.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-neutral-400">
          <p className="text-lg font-medium">Архів порожній</p>
          <p className="max-w-60 text-sm">
            Сюди щодня автоматично переїжджають виконані задачі минулих днів
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {archived.map((task) => (
            <li
              key={task.id}
              className="flex items-baseline justify-between gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3"
            >
              <span className="text-neutral-400 line-through">{task.title}</span>
              {task.doneAt && (
                <span className="shrink-0 text-xs text-neutral-400">
                  {new Date(task.doneAt).toLocaleDateString("uk-UA", {
                    day: "numeric",
                    month: "long",
                  })}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
