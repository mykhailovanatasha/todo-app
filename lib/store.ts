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

  function addTasks(parsed: ParsedTask[]): { today: number; inbox: number } {
    const now = Date.now();
    const todayIso = localISODate();
    let todayCount = 0;
    const newTasks: Task[] = parsed.map((p, i) => {
      // задачі з сьогоднішнім дедлайном одразу йдуть у план дня
      const isToday = p.deadline === todayIso;
      if (isToday) todayCount++;
      return {
        id: crypto.randomUUID(),
        title: p.title,
        priority: p.priority,
        time: p.time ?? undefined,
        deadline: p.deadline ?? undefined,
        today: isToday,
        done: false,
        createdAt: now + i,
      };
    });
    setTasks((prev) => [...newTasks, ...prev]);
    return { today: todayCount, inbox: parsed.length - todayCount };
  }

  function toggleDone(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  }

  function toggleToday(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, today: !t.today } : t)),
    );
  }

  function removeTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  return {
    tasks,
    setTasks,
    captures,
    addCapture,
    addTasks,
    toggleDone,
    toggleToday,
    removeTask,
    loaded: tasksLoaded && capturesLoaded,
  };
}
