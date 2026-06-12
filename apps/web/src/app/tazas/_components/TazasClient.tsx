"use client";

import { useEffect, useState, useCallback } from "react";

type MoodState = {
  id: string;
  label: string;
  emoji: string;
  order: number;
};

type Partner = {
  name: string;
  currentMood: MoodState | null;
};

type TazasData = {
  moods: MoodState[];
  currentMoodId: string | null;
  partner: Partner | null;
};

type TouchStats = {
  total: number;
  mine: number;
  partner: number;
};

type TouchData = {
  today: TouchStats | null;
  month: TouchStats | null;
};

export default function TazasClient({
  initial,
  initialTouches,
}: {
  initial: TazasData;
  initialTouches: TouchData;
}) {
  const [data, setData] = useState<TazasData>(initial);
  const [touches, setTouches] = useState<TouchData>(initialTouches);
  const [selecting, setSelecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [touching, setTouching] = useState(false);

  const refresh = useCallback(async () => {
    const [moodsRes, touchesRes] = await Promise.all([
      fetch("/api/moods"),
      fetch("/api/touches/stats"),
    ]);
    if (moodsRes.ok) setData(await moodsRes.json());
    if (touchesRes.ok) setTouches(await touchesRes.json());
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const currentMood = data.moods.find((m) => m.id === data.currentMoodId) ?? null;

  async function setMood(moodId: string | null) {
    setSaving(true);
    setSelecting(false);
    await fetch("/api/moods/current", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moodId }),
    });
    await refresh();
    setSaving(false);
  }

  async function sendTouch() {
    if (touching) return;
    setTouching(true);

    // Optimistic update
    setTouches((prev) => ({
      ...prev,
      today: prev.today
        ? { ...prev.today, total: prev.today.total + 1, mine: prev.today.mine + 1 }
        : { total: 1, mine: 1, partner: 0 },
      month: prev.month
        ? { ...prev.month, total: prev.month.total + 1, mine: prev.month.mine + 1 }
        : { total: 1, mine: 1, partner: 0 },
    }));

    await fetch("/api/touches", { method: "POST" });

    setTimeout(() => setTouching(false), 600);
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Taza de la pareja */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 border-b border-gray-100 py-12">
        {data.partner ? (
          <>
            <p className="text-xs uppercase tracking-widest text-gray-400">
              {data.partner.name}
            </p>
            {data.partner.currentMood ? (
              <>
                <span className="text-8xl">{data.partner.currentMood.emoji}</span>
                <p className="text-sm text-gray-600 text-center max-w-xs">
                  {data.partner.currentMood.label}
                </p>
              </>
            ) : (
              <span className="text-6xl opacity-20">🫙</span>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-400">Tu pareja todavía no se unió</p>
        )}
      </div>

      {/* Tu taza */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8">
        <p className="text-xs uppercase tracking-widest text-gray-400">Vos</p>
        <button
          onClick={() => setSelecting(true)}
          disabled={saving}
          className="flex flex-col items-center gap-2 group"
        >
          {currentMood ? (
            <>
              <span className="text-8xl group-hover:scale-110 transition-transform">
                {currentMood.emoji}
              </span>
              <p className="text-sm text-gray-600 text-center max-w-xs">
                {currentMood.label}
              </p>
            </>
          ) : (
            <>
              <span className="text-6xl opacity-30 group-hover:opacity-50 transition-opacity">
                🫙
              </span>
              <p className="text-sm text-gray-400">Tocá para compartir cómo estás</p>
            </>
          )}
        </button>
        {currentMood && (
          <button onClick={() => setMood(null)} className="text-xs text-gray-400 underline">
            Limpiar estado
          </button>
        )}
      </div>

      {/* Toques */}
      <div className="border-t border-gray-100 px-6 py-5 flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-xs text-gray-400 uppercase tracking-widest">Toques hoy</p>
          {touches.today ? (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold">{touches.today.total}</span>
              <span className="text-xs text-gray-400">
                vos {touches.today.mine} · pareja {touches.today.partner}
              </span>
            </div>
          ) : (
            <span className="text-2xl font-semibold">0</span>
          )}
          {touches.month && (
            <p className="text-xs text-gray-400">{touches.month.total} este mes</p>
          )}
        </div>

        <button
          onClick={sendTouch}
          disabled={touching}
          className={`w-16 h-16 rounded-full bg-black text-white flex items-center justify-center text-2xl transition-transform active:scale-90 ${
            touching ? "scale-110" : ""
          }`}
        >
          💕
        </button>
      </div>

      {/* Selector de mood */}
      {selecting && (
        <div
          className="fixed inset-0 bg-black/40 flex items-end z-50"
          onClick={() => setSelecting(false)}
        >
          <div
            className="w-full bg-white rounded-t-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />
            <p className="text-sm font-medium text-center text-gray-500">¿Cómo estás?</p>
            <div className="grid grid-cols-2 gap-3">
              {data.moods.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => setMood(mood.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                    data.currentMoodId === mood.id
                      ? "border-black bg-gray-50"
                      : "border-gray-100 hover:border-gray-300"
                  }`}
                >
                  <span className="text-3xl">{mood.emoji}</span>
                  <span className="text-xs text-gray-700 leading-snug">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
