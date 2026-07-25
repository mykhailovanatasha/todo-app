"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePlanner } from "@/lib/store";

const BOT_USERNAME = "stepan_planer_bot";

type Prefs = {
  morning: number | null;
  midday: number | null;
  evening: number | null;
};

type SlotDef = { key: keyof Prefs; icon: string; label: string };
const SLOTS: SlotDef[] = [
  { key: "morning", icon: "☀️", label: "План на день" },
  { key: "midday", icon: "🕑", label: "Прогрес + відмітити зроблене" },
  { key: "evening", icon: "🌙", label: "Що ще лишилось" },
];

const HOURS = Array.from({ length: 24 }, (_, h) => h);

export default function SettingsPage() {
  const { userId } = usePlanner();
  const [linked, setLinked] = useState<boolean | null>(null);
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userId) return;
    let stop = false;
    const check = async () => {
      try {
        const res = await fetch(`/api/telegram/status?userId=${userId}`);
        const data = await res.json();
        if (!stop) setLinked(!!data.linked);
      } catch {}
    };
    check();
    const iv = setInterval(check, 3000);
    return () => {
      stop = true;
      clearInterval(iv);
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const res = await fetch(`/api/prefs?userId=${userId}`);
        setPrefs(await res.json());
      } catch {}
    })();
  }, [userId]);

  function update(key: keyof Prefs, value: number | null) {
    if (!prefs || !userId) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    fetch("/api/prefs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, prefs: next }),
    }).catch(() => {});
    setSavedFlash(true);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setSavedFlash(false), 1500);
  }

  const connectUrl = userId
    ? `https://t.me/${BOT_USERNAME}?start=${userId}`
    : "#";

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-2 pb-4">
        <Link
          href="/"
          aria-label="Назад"
          className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-400 active:bg-neutral-100"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold">Налаштування</h1>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <img
            src="/stepan.jpg"
            alt="Степан"
            className="h-12 w-12 rounded-full border border-neutral-200 object-cover"
          />
          <div>
            <p className="font-semibold">Нагадування в Telegram</p>
            <p className="text-sm text-neutral-500">Степан писатиме тобі щодня</p>
          </div>
        </div>

        {linked === true ? (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-green-50 py-3 text-sm font-semibold text-green-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Telegram підключено
          </div>
        ) : (
          <a
            href={connectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-4 flex h-12 items-center justify-center gap-2 rounded-xl text-base font-semibold text-white ${
              userId ? "bg-red-500 active:scale-[0.98]" : "bg-neutral-300"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M21.5 4.5L2.5 12l6 2.5L18 7l-7 9.5 8 3.5z" />
            </svg>
            Підключити Telegram
          </a>
        )}

        {linked === false && (
          <p className="pt-3 text-center text-xs text-neutral-400">
            Кнопка відкриє бота — натисни там «Запустити»/Start
          </p>
        )}
      </div>

      {/* Час нагадувань */}
      <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <p className="font-semibold">Час нагадувань</p>
          {savedFlash && (
            <span className="text-xs font-medium text-green-600">збережено ✓</span>
          )}
        </div>
        <p className="pt-1 text-sm text-neutral-500">
          Обери свій час для кожного або вимкни зайве
        </p>

        <div className="flex flex-col gap-3 pt-4">
          {SLOTS.map((s) => (
            <div key={s.key} className="flex items-center gap-3">
              <span className="text-xl">{s.icon}</span>
              <span className="flex-1 text-sm">{s.label}</span>
              <select
                value={prefs ? (prefs[s.key] ?? "") : ""}
                disabled={!prefs}
                onChange={(e) =>
                  update(s.key, e.target.value === "" ? null : Number(e.target.value))
                }
                className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-accent disabled:opacity-40"
              >
                <option value="">Вимк.</option>
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
