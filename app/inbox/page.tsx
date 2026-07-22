"use client";

import { useState } from "react";
import { usePlanner, type Priority, type Task } from "@/lib/store";
import { formatDeadline, inboxGroup, type InboxGroup } from "@/lib/dates";
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

const GROUP_ORDER: InboxGroup[] = [
  "overdue",
  "today",
  "week",
  "later",
  "someday",
];

const GROUP_LABELS: Record<InboxGroup, string> = {
  overdue: "Прострочено",
  today: "Сьогодні",
  week: "Цей тиждень",
  later: "Пізніше",
  someday: "Колись",
};

function InboxCard({ task }: { task: Task }) {
  const { toggleToday, removeTask, editTask } = usePlanner();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);

  function saveEdit() {
    const trimmed = draft.trim();
    if (trimmed) editTask(task.id, { title: trimmed });
    else setDraft(task.title);
    setEditing(false);
  }

  return (
    <li
      className={`rounded-2xl border border-l-4 border-neutral-200 bg-white p-4 ${priorityBorder[task.priority]}`}
    >
      <div className="flex items-start justify-between gap-2">
        {editing ? (
          <input
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEdit();
              if (e.key === "Escape") {
                setDraft(task.title);
                setEditing(false);
              }
            }}
            className="flex-1 rounded-lg border border-accent bg-white px-2 py-1 text-base font-medium outline-none"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="flex-1 text-left text-base font-medium active:opacity-60"
          >
            {task.title}
          </button>
        )}
        <div className="flex shrink-0 items-center">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              aria-label="Редагувати"
              className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-300 active:bg-neutral-100 active:text-neutral-500"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
              </svg>
            </button>
          )}
          <button
            onClick={() => removeTask(task.id)}
            aria-label="Видалити задачу"
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-300 active:bg-neutral-100 active:text-neutral-500"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
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
        className="mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-red-50 text-sm font-semibold text-red-600 active:scale-[0.98]"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
        На сьогодні
      </button>
    </li>
  );
}

export default function InboxPage() {
  const { tasks, loaded } = usePlanner();
  const inbox = tasks
    .filter((t) => !t.today && !t.archived)
    .sort(byDeadlineThenPriority);

  const groups = GROUP_ORDER.map((key) => ({
    key,
    items: inbox.filter((t) => inboxGroup(t.deadline) === key),
  })).filter((g) => g.items.length > 0);

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
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <section key={group.key}>
              <h2
                className={`pb-2 text-sm font-semibold ${
                  group.key === "overdue"
                    ? "text-red-500"
                    : group.key === "today"
                      ? "text-red-600"
                      : "text-neutral-400"
                }`}
              >
                {GROUP_LABELS[group.key]} · {group.items.length}
              </h2>
              <ul className="flex flex-col gap-3">
                {group.items.map((task) => (
                  <InboxCard key={task.id} task={task} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
