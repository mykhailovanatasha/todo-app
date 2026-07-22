"use client";

import { useEffect, useState } from "react";
import { localISODate } from "@/lib/dates";

export type Priority = "low" | "medium" | "high";

export type Task = {
  id: string;
  title: string;
  priority: Priority;
  time?: string; // "14:00"
  deadline?: string; // ISO-дата, наприклад "2026-07-25"
  today: boolean;
  done: boolean;
  doneAt?: number;
  archived?: boolean;
  createdAt: number;
};

export type Capture = {
  id: string;
  text: string;
  createdAt: number;
};

function useStored<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw));
    } catch {
      // зіпсовані дані ігноруємо, стартуємо з initial
    }
    setLoaded(true);
  }, [key]);

  useEffect(() => {
    if (loaded) localStorage.setItem(key, JSON.stringify(value));
  }, [key, value, loaded]);

  return [value, setValue, loaded] as const;
}

export type ParsedTask = {
  title: string;
  priority: Priority;
  time: string | null;
  deadline: string | null;
};

export function usePlanner() {
  const [tasks, setTasks, tasksLoaded] = useStored<Task[]>("planner.tasks", []);
  const [captures, setCaptures, capturesLoaded] = useStored<Capture[]>(
    "planner.captures",
    [],
  );

  function addCapture(text: string) {
    const capture: Capture = {
      id: crypto.randomUUID(),
      text: text.trim(),
      createdAt: Date.now(),
    };
    setCaptures((prev) => [capture, ...prev]);
  }

  // Усі нові задачі йдуть в Inbox; у Today користувач відправляє їх сам.
  // dueToday — скільки з них мають дедлайн сьогодні (для підказки).
  function addTasks(parsed: ParsedTask[]): { total: number; dueToday: number } {
    const now = Date.now();
    const todayIso = localISODate();
    let dueToday = 0;
    const newTasks: Task[] = parsed.map((p, i) => {
      if (p.deadline === todayIso) dueToday++;
      return {
        id: crypto.randomUUID(),
        title: p.title,
        priority: p.priority,
        time: p.time ?? undefined,
        deadline: p.deadline ?? undefined,
        today: false,
        done: false,
        createdAt: now + i,
      };
    });
    setTasks((prev) => [...newTasks, ...prev]);
    return { total: parsed.length, dueToday };
  }

  // Виконані вчора й раніше задачі переносимо в архів, щоб списки не розросталися
  useEffect(() => {
    if (!tasksLoaded) return;
    const startOfToday = new Date(new Date().toDateString()).getTime();
    setTasks((prev) => {
      let changed = false;
      const next = prev.map((t) => {
        if (t.done && !t.archived && (t.doneAt ?? t.createdAt) < startOfToday) {
          changed = true;
          return { ...t, archived: true };
        }
        return t;
      });
      return changed ? next : prev;
    });
  }, [tasksLoaded, setTasks]);

  function toggleDone(id: string) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, done: !t.done, doneAt: !t.done ? Date.now() : undefined }
          : t,
      ),
    );
  }

  function clearArchive() {
    setTasks((prev) => prev.filter((t) => !t.archived));
  }

  function toggleToday(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, today: !t.today } : t)),
    );
  }

  function removeTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function editTask(id: string, patch: Partial<Pick<Task, "title" | "priority" | "time" | "deadline">>) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    );
  }

  return {
    tasks,
    setTasks,
    captures,
    addCapture,
    addTasks,
    editTask,
    toggleDone,
    toggleToday,
    removeTask,
    clearArchive,
    loaded: tasksLoaded && capturesLoaded,
  };
}
