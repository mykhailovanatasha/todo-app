"use client";

import { useEffect, useRef, useState } from "react";
import { usePlanner, type ParsedTask } from "@/lib/store";

type Status = { kind: "ok" | "error"; message: string };

export default function CapturePage() {
  const { addCapture, addTasks } = usePlanner();
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const recRef = useRef<any>(null);

  useEffect(() => {
    return () => recRef.current?.stop();
  }, []);

  function toggleMic() {
    if (recording) {
      recRef.current?.stop();
      return;
    }
    const w = window as any;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError("Диктування не підтримується цим браузером — спробуй Chrome або Safari.");
      return;
    }
    setMicError(null);
    const rec = new SpeechRecognition();
    rec.lang = "uk-UA";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      let chunk = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) chunk += e.results[i][0].transcript + " ";
      }
      if (chunk) {
        setText((prev) => (prev ? prev.trimEnd() + " " : "") + chunk.trim());
      }
    };
    rec.onend = () => setRecording(false);
    rec.onerror = () => setRecording(false);
    recRef.current = rec;
    rec.start();
    setRecording(true);
  }

  async function save() {
    const trimmed = text.trim();
    if (!trimmed || parsing) return;

    setParsing(true);
    setStatus(null);
    addCapture(trimmed);

    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Помилка сервера");
      }
      const tasks: ParsedTask[] = data.tasks ?? [];
      const placed = addTasks(tasks);
      setText("");
      let message: string;
      if (tasks.length === 0) {
        message = "AI не знайшов задач у цьому записі";
      } else if (placed.today > 0 && placed.inbox > 0) {
        message = `AI створив задач: ${tasks.length} ✓ — ${placed.today} на сьогодні → Today, ${placed.inbox} → Inbox`;
      } else if (placed.today > 0) {
        message = `AI створив задач: ${tasks.length} ✓ — всі на сьогодні → Today`;
      } else {
        message = `AI створив задач: ${tasks.length} ✓ — дивись Inbox`;
      }
      setStatus({ kind: "ok", message });
    } catch (e) {
      setStatus({
        kind: "error",
        message: e instanceof Error ? e.message : "Не вдалося розібрати запис",
      });
    } finally {
      setParsing(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="pb-3 text-2xl font-bold">Що в голові?</h1>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Виливай усе підряд: зустрічі, ідеї, «не забути купити»… AI сам розбере це на задачі."
        className="flex-1 resize-none rounded-2xl border border-neutral-200 bg-white p-4 text-lg leading-relaxed outline-none placeholder:text-neutral-400 focus:border-accent"
      />

      {micError && <p className="pt-2 text-sm text-red-500">{micError}</p>}
      {status && (
        <p
          className={`pt-2 text-sm font-medium ${
            status.kind === "ok" ? "text-accent" : "text-red-500"
          }`}
        >
          {status.message}
        </p>
      )}

      <div className="flex items-center gap-3 pt-4">
        <button
          onClick={toggleMic}
          aria-label={recording ? "Зупинити диктування" : "Почати диктування"}
          className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full shadow-lg transition-colors active:scale-95 ${
            recording
              ? "animate-pulse bg-red-500 text-white"
              : "bg-accent text-white"
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-9 w-9">
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
            <path d="M19 10v2a7 7 0 01-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </button>

        <button
          onClick={save}
          disabled={!text.trim() || parsing}
          className="flex h-16 flex-1 items-center justify-center gap-2 rounded-2xl bg-neutral-900 text-lg font-semibold text-white transition-opacity active:scale-[0.98] disabled:opacity-30"
        >
          {parsing ? (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5 animate-spin">
                <path d="M21 12a9 9 0 11-6.22-8.56" />
              </svg>
              AI розбирає…
            </>
          ) : (
            "Зберегти"
          )}
        </button>
      </div>
    </div>
  );
}
