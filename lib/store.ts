"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { localISODate } from "@/lib/dates";
import type { Priority, Task, Capture } from "@/lib/types";

export type { Priority, Task, Capture } from "@/lib/types";

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

// Стабільний анонімний ідентифікатор користувача (для звʼязку застосунок ↔ хмара ↔ Telegram)
function useUserId(): string | null {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    let id = localStorage.getItem("planner.userId");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("planner.userId", id);
    }
    setUserId(id);
  }, []);
  return userId;
}

// Задачі в хмарі (єдине джерело правди) + миттєвий локальний кеш
function useCloudTasks() {
  const userId = useUserId();
  const [tasks, setTasksState] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);
  const updatedAtRef = useRef(0);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Початкове завантаження: кеш миттєво, потім хмара
  useEffect(() => {
    if (!userId) return;
    try {
      const raw = localStorage.getItem("planner.tasks");
      if (raw) setTasksState(JSON.parse(raw));
    } catch {}

    (async () => {
      try {
        const res = await fetch(`/api/tasks?userId=${userId}`);
        const data = await res.json();
        if (data.tasks) {
          updatedAtRef.current = data.updatedAt;
          setTasksState(data.tasks);
          localStorage.setItem("planner.tasks", JSON.stringify(data.tasks));
        } else {
          // хмара порожня — переносимо локальні задачі, якщо є
          const raw = localStorage.getItem("planner.tasks");
          const local: Task[] = raw ? JSON.parse(raw) : [];
          if (local.length) {
            const r = await fetch("/api/tasks", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId, tasks: local }),
            });
            updatedAtRef.current = (await r.json()).updatedAt;
          }
        }
      } catch {
        // офлайн — працюємо з кешу
      }
      setLoaded(true);
    })();
  }, [userId]);

  // Опитування хмари: підхоплюємо зміни з Telegram
  useEffect(() => {
    if (!userId) return;
    const poll = async () => {
      try {
        const res = await fetch(`/api/tasks?userId=${userId}`);
        const data = await res.json();
        if (data.tasks && data.updatedAt > updatedAtRef.current) {
          updatedAtRef.current = data.updatedAt;
          setTasksState(data.tasks);
          localStorage.setItem("planner.tasks", JSON.stringify(data.tasks));
        }
      } catch {}
    };
    const iv = setInterval(poll, 20000);
    window.addEventListener("focus", poll);
    return () => {
      clearInterval(iv);
      window.removeEventListener("focus", poll);
    };
  }, [userId]);

  // Обгортка сеттера: локально миттєво, у хмару — з невеликою затримкою
  const setTasks = useCallback(
    (updater: Task[] | ((prev: Task[]) => Task[])) => {
      setTasksState((prev) => {
        const next =
          typeof updater === "function"
            ? (updater as (p: Task[]) => Task[])(prev)
            : updater;
        try {
          localStorage.setItem("planner.tasks", JSON.stringify(next));
        } catch {}
        if (userId) {
          if (pushTimer.current) clearTimeout(pushTimer.current);
          pushTimer.current = setTimeout(async () => {
            try {
              const r = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, tasks: next }),
              });
              updatedAtRef.current = (await r.json()).updatedAt;
            } catch {}
          }, 600);
        }
        return next;
      });
    },
    [userId],
  );

  return { tasks, setTasks, loaded, userId };
}

export type ParsedTask = {
  title: string;
  priority: Priority;
  time: string | null;
  deadline: string | null;
};

export function usePlanner() {
  const {
    tasks,
    setTasks,
    loaded: tasksLoaded,
    userId,
  } = useCloudTasks();
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
    userId,
    loaded: tasksLoaded && capturesLoaded,
  };
}
