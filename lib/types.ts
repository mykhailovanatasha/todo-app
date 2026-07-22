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
