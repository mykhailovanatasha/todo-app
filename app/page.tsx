"use client";

import { useEffect, useRef, useState } from "react";
import { usePlanner } from "@/lib/store";

export default function CapturePage() {
  const { addCapture } = usePlanner();
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [saved, setSaved] = useState(false);
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

  function save() {
    if (!text.trim()) return;
    addCapture(text);
    setText("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
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

      {micError && (
        <p className="pt-2 text-sm text-red-500">{micError}</p>
      )}
      {saved && (
        <p className="pt-2 text-sm font-medium text-accent">
          Збережено ✓ — AI-розбір на задачі з&apos;явиться в наступній версії
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
          disabled={!text.trim()}
          className="h-16 flex-1 rounded-2xl bg-neutral-900 text-lg font-semibold text-white transition-opacity active:scale-[0.98] disabled:opacity-30"
        >
          Зберегти
        </button>
      </div>
    </div>
  );
}
