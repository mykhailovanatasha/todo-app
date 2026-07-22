"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePlanner } from "@/lib/store";

const BOT_USERNAME = "stepan_planer_bot";

export default function SettingsPage() {
  const { userId } = usePlanner();
  const [linked, setLinked] = useState<boolean | null>(null);

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
    // поки не підключено — перевіряємо кожні 3с (щоб зловити момент /start)
    const iv = setInterval(check, 3000);
    return () => {
      stop = true;
      clearInterval(iv);
    };
  }, [userId]);

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
            <p className="text-sm text-neutral-500">
              Степан писатиме тобі щодня
            </p>
          </div>
        </div>

        <ul className="flex flex-col gap-1 py-4 text-sm text-neutral-600">
          <li>☀️ <b>10:00</b> — план на день</li>
          <li>🕑 <b>14:00</b> — прогрес + відмітити зроблене</li>
          <li>🌙 <b>21:00</b> — що ще лишилось</li>
        </ul>

        {linked === true ? (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-green-50 py-3 text-sm font-semibold text-green-700">
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
            className={`flex h-12 items-center justify-center gap-2 rounded-xl text-base font-semibold text-white ${
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
    </div>
  );
}
