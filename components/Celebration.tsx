"use client";

const COLORS = ["#ef4444", "#f59e0b", "#4f46e5", "#10b981", "#ec4899"];

export default function Celebration({ onClose }: { onClose: () => void }) {
  const pieces = Array.from({ length: 60 });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {pieces.map((_, i) => {
          const left = Math.random() * 100;
          const delay = Math.random() * 0.6;
          const duration = 2.2 + Math.random() * 1.3;
          const size = 7 + Math.random() * 7;
          return (
            <span
              key={i}
              className="absolute top-0 rounded-[2px]"
              style={{
                left: `${left}%`,
                width: `${size}px`,
                height: `${size * 1.4}px`,
                backgroundColor: COLORS[i % COLORS.length],
                animation: `confetti-fall ${duration}s linear ${delay}s forwards`,
              }}
            />
          );
        })}
      </div>

      <div
        className="mx-6 flex flex-col items-center gap-4 rounded-3xl bg-white px-8 py-9 text-center shadow-xl"
        style={{ animation: "pop-in 0.4s ease-out" }}
      >
        <img
          src="/stepan.jpg"
          alt="Степан"
          className="h-24 w-24 rounded-full border-2 border-neutral-200 object-cover"
        />
        <div>
          <p className="text-xl font-bold">Всі справи зроблено! 🎉</p>
          <p className="pt-1 text-neutral-500">Степан пишається тобою 👨‍🍳</p>
        </div>
        <button
          onClick={onClose}
          className="mt-1 h-11 rounded-xl bg-red-500 px-8 text-sm font-semibold text-white active:scale-95"
        >
          Дякую!
        </button>
      </div>
    </div>
  );
}
