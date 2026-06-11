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

export default function TazasClient({ initial }: { initial: TazasData }) {
  const [data, setData] = useState<TazasData>(initial);
  const [selecting, setSelecting] = useState(false);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/moods");
    if (res.ok) setData(await res.json());
  }, []);

  // Polling cada 30s para actualizar la taza de la pareja
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
      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12">
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
          <button
            onClick={() => setMood(null)}
            className="text-xs text-gray-400 underline mt-1"
          >
            Limpiar estado
          </button>
        )}
      </div>

      {/* Selector de mood */}
      {selecting && (
        <div className="fixed inset-0 bg-black/40 flex items-end z-50" onClick={() => setSelecting(false)}>
          <div
            className="w-full bg-white rounded-t-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />
            <p className="text-sm font-medium text-center text-gray-500">
              ¿Cómo estás?
            </p>
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
