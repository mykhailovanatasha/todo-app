"use client";

import { useEffect, useState } from "react";

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

  function toggleDone(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  }

  return {
    tasks,
    setTasks,
    captures,
    addCapture,
    toggleDone,
    loaded: tasksLoaded && capturesLoaded,
  };
}
