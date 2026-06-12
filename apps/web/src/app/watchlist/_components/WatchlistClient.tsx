"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

type User = { id: string; name: string };
type Vote = { userId: string; want: boolean };
type Review = {
  id: string;
  userId: string;
  rating: number;
  text: string | null;
  user: User;
};
type WatchItem = {
  id: string;
  title: string;
  type: string;
  platform: string | null;
  coverUrl: string | null;
  trailerUrl: string | null;
  description: string | null;
  year: number | null;
  status: "PENDING" | "BUCKET" | "WATCHED" | "SKIPPED";
  addedByUser: User;
  votes: Vote[];
  reviews: Review[];
};
type TmdbResult = {
  tmdbId: number;
  title: string;
  mediaType: "MOVIE" | "SERIES";
  year: number | null;
  poster: string | null;
  overview: string | null;
};
type Tab = "pending" | "bucket" | "watched";

const TYPE_LABEL: Record<string, string> = {
  MOVIE: "Película",
  SERIES: "Serie",
  DOCUMENTARY: "Documental",
  ANIME: "Anime",
  SHORT: "Corto",
};
const CONTENT_TYPES = ["MOVIE", "SERIES", "DOCUMENTARY", "ANIME", "SHORT"] as const;

// ─── Stars ────────────────────────────────────────────────────────────────────

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <span className="flex gap-0.5 text-amber-400">
      {[1, 2, 3, 4, 5].map((i) => {
        const full = value >= i * 2;
        const half = !full && value >= i * 2 - 1;
        return (
          <button
            key={i}
            type="button"
            className={`text-xl leading-none ${onChange ? "cursor-pointer" : "cursor-default"}`}
            onPointerDown={(e) => {
              if (!onChange) return;
              const rect = e.currentTarget.getBoundingClientRect();
              onChange(e.clientX - rect.left < rect.width / 2 ? i * 2 - 1 : i * 2);
              e.preventDefault();
            }}
          >
            {full ? "★" : half ? "⯨" : "☆"}
          </button>
        );
      })}
      <span className="ml-1 text-xs text-gray-400">{(value / 2).toFixed(1)}</span>
    </span>
  );
}

// ─── Poster ───────────────────────────────────────────────────────────────────

function Poster({ src, title, size = "sm" }: { src: string | null; title: string; size?: "sm" | "md" | "lg" }) {
  const dims = { sm: "w-10 h-14", md: "w-16 h-24", lg: "w-24 h-36" };
  if (!src) {
    return (
      <div className={`${dims[size]} rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0`}>
        <span className="text-gray-300 text-lg">🎬</span>
      </div>
    );
  }
  return (
    <div className={`${dims[size]} relative rounded-lg overflow-hidden flex-shrink-0`}>
      <Image src={src} alt={title} fill className="object-cover" sizes="96px" unoptimized />
    </div>
  );
}

// ─── Trailer button ───────────────────────────────────────────────────────────

function TrailerBtn({ url }: { url: string | null }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.75 15.5V8.5l6.5 3.5-6.5 3.5z" />
      </svg>
      Trailer
    </a>
  );
}

// ─── Search form (add item) ───────────────────────────────────────────────────

type FormState =
  | { step: "closed" }
  | { step: "searching"; query: string; results: TmdbResult[]; loading: boolean }
  | {
      step: "confirm";
      result: TmdbResult;
      platform: string;
      trailerUrl: string | null;
      trailerLoading: boolean;
      manualType: string;
    }
  | { step: "manual"; title: string; type: string; platform: string; year: string };

export function AddItemForm({ onAdd }: { onAdd: (item: WatchItem) => void }) {
  const [form, setForm] = useState<FormState>({ step: "closed" });
  const [saving, setSaving] = useState(false);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openSearch() {
    setForm({ step: "searching", query: "", results: [], loading: false });
  }

  function handleQueryChange(q: string) {
    if (form.step !== "searching") return;
    setForm({ ...form, query: q, loading: q.length >= 2 });
    if (searchRef.current) clearTimeout(searchRef.current);
    if (q.length < 2) {
      setForm((prev) =>
        prev.step === "searching" ? { ...prev, results: [], loading: false } : prev
      );
      return;
    }
    searchRef.current = setTimeout(async () => {
      const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) {
        setForm((prev) =>
          prev.step === "searching" ? { ...prev, loading: false } : prev
        );
        return;
      }
      const { results } = await res.json();
      setForm((prev) =>
        prev.step === "searching" ? { ...prev, results, loading: false } : prev
      );
    }, 350);
  }

  async function selectResult(r: TmdbResult) {
    setForm({
      step: "confirm",
      result: r,
      platform: "",
      trailerUrl: null,
      trailerLoading: true,
      manualType: r.mediaType,
    });
    const mediaTypeParam = r.mediaType === "MOVIE" ? "movie" : "tv";
    const res = await fetch(`/api/tmdb/trailer?tmdbId=${r.tmdbId}&mediaType=${mediaTypeParam}`);
    const { trailerUrl } = res.ok ? await res.json() : { trailerUrl: null };
    setForm((prev) =>
      prev.step === "confirm" ? { ...prev, trailerUrl, trailerLoading: false } : prev
    );
  }

  async function confirmAdd() {
    if (form.step !== "confirm") return;
    setSaving(true);
    const { result, platform, trailerUrl, manualType } = form;
    const res = await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: result.title,
        type: manualType,
        platform: platform.trim() || null,
        coverUrl: result.poster,
        trailerUrl,
        description: result.overview,
        year: result.year,
        tmdbId: result.tmdbId,
      }),
    });
    if (res.ok) {
      const { item } = await res.json();
      onAdd(item);
      setForm({ step: "closed" });
    }
    setSaving(false);
  }

  async function manualAdd(e: React.FormEvent) {
    e.preventDefault();
    if (form.step !== "manual" || !form.title.trim()) return;
    setSaving(true);
    const res = await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title.trim(),
        type: form.type,
        platform: form.platform.trim() || null,
        year: null,
      }),
    });
    if (res.ok) {
      const { item } = await res.json();
      onAdd(item);
      setForm({ step: "closed" });
    }
    setSaving(false);
  }

  if (form.step === "closed") {
    return (
      <button
        onClick={openSearch}
        className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors"
      >
        + Agregar título
      </button>
    );
  }

  if (form.step === "searching") {
    return (
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 flex-shrink-0">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            autoFocus
            value={form.query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Buscar película o serie…"
            className="flex-1 text-sm outline-none bg-transparent"
          />
          {form.loading && (
            <svg className="animate-spin w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
            </svg>
          )}
          <button onClick={() => setForm({ step: "closed" })} className="text-gray-400 text-xs px-1">
            ✕
          </button>
        </div>

        {form.results.length > 0 && (
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {form.results.map((r) => (
              <button
                key={r.tmdbId}
                onClick={() => selectResult(r)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left"
              >
                <Poster src={r.poster} title={r.title} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.title}</p>
                  <p className="text-xs text-gray-400">
                    {TYPE_LABEL[r.mediaType]}{r.year ? ` · ${r.year}` : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {form.query.length >= 2 && !form.loading && form.results.length === 0 && (
          <div className="px-4 py-3 text-center text-sm text-gray-400">
            Sin resultados.{" "}
            <button
              onClick={() =>
                setForm({ step: "manual", title: form.query, type: "MOVIE", platform: "", year: "" })
              }
              className="text-black underline"
            >
              Agregar manualmente
            </button>
          </div>
        )}
      </div>
    );
  }

  if (form.step === "confirm") {
    const { result, platform, trailerUrl, trailerLoading, manualType } = form;
    return (
      <div className="border border-gray-100 rounded-xl p-4 space-y-4">
        <div className="flex gap-3">
          <Poster src={result.poster} title={result.title} size="md" />
          <div className="flex-1 min-w-0 space-y-1">
            <p className="font-semibold text-sm leading-tight">{result.title}</p>
            <p className="text-xs text-gray-400">
              {TYPE_LABEL[manualType]}{result.year ? ` · ${result.year}` : ""}
            </p>
            {trailerLoading ? (
              <p className="text-xs text-gray-400">Buscando trailer…</p>
            ) : trailerUrl ? (
              <TrailerBtn url={trailerUrl} />
            ) : (
              <p className="text-xs text-gray-400">Sin trailer disponible</p>
            )}
          </div>
        </div>

        {result.overview && (
          <p className="text-xs text-gray-500 line-clamp-3">{result.overview}</p>
        )}

        <div className="flex gap-2">
          <select
            value={manualType}
            onChange={(e) =>
              setForm((prev) => prev.step === "confirm" ? { ...prev, manualType: e.target.value } : prev)
            }
            className="border border-gray-200 rounded-lg px-2 py-2 text-xs outline-none"
          >
            {CONTENT_TYPES.map((t) => (
              <option key={t} value={t}>{TYPE_LABEL[t]}</option>
            ))}
          </select>
          <input
            value={platform}
            onChange={(e) =>
              setForm((prev) => prev.step === "confirm" ? { ...prev, platform: e.target.value } : prev)
            }
            placeholder="Plataforma (Netflix…)"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-gray-400"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={confirmAdd}
            disabled={saving || trailerLoading}
            className="flex-1 bg-black text-white text-sm rounded-xl py-2.5 disabled:opacity-40"
          >
            Agregar a la lista
          </button>
          <button
            onClick={() => setForm({ step: "searching", query: result.title, results: [], loading: false })}
            className="px-3 text-sm text-gray-500 border border-gray-200 rounded-xl"
          >
            ←
          </button>
        </div>
      </div>
    );
  }

  // Manual form
  return (
    <form onSubmit={manualAdd} className="border border-gray-100 rounded-xl p-4 space-y-3">
      <p className="text-xs text-gray-500 font-medium">Agregar manualmente</p>
      <input
        autoFocus
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="Título"
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
      />
      <div className="flex gap-2">
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
        >
          {CONTENT_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
        </select>
        <input
          value={form.year}
          onChange={(e) => setForm({ ...form, year: e.target.value })}
          placeholder="Año"
          type="number"
          className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
        />
      </div>
      <input
        value={form.platform}
        onChange={(e) => setForm({ ...form, platform: e.target.value })}
        placeholder="Plataforma (opcional)"
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || !form.title.trim()}
          className="flex-1 bg-black text-white text-sm rounded-lg py-2 disabled:opacity-40"
        >
          Agregar
        </button>
        <button type="button" onClick={() => setForm({ step: "closed" })} className="px-4 text-sm text-gray-500">
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ─── Review modal ─────────────────────────────────────────────────────────────

function ReviewModal({
  item,
  myReview,
  onSave,
  onClose,
}: {
  item: WatchItem;
  myReview: Review | null;
  onSave: (review: Review) => void;
  onClose: () => void;
}) {
  const [rating, setRating] = useState(myReview?.rating ?? 6);
  const [text, setText] = useState(myReview?.text ?? "");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/watchlist/${item.id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, text: text.trim() || null }),
    });
    if (res.ok) onSave((await res.json()).review);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end z-50" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-2xl p-6 space-y-4 safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />
        <div className="flex gap-3 items-start">
          <Poster src={item.coverUrl} title={item.title} size="md" />
          <div className="space-y-1">
            <p className="font-semibold">{item.title}</p>
            <p className="text-xs text-gray-400">{TYPE_LABEL[item.type]}{item.year ? ` · ${item.year}` : ""}</p>
            <TrailerBtn url={item.trailerUrl} />
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-gray-400 uppercase tracking-widest">Tu puntuación</p>
            <Stars value={rating} onChange={setRating} />
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="¿Qué te pareció? (opcional)"
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 resize-none"
          />
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-black text-white text-sm rounded-xl py-3 disabled:opacity-40"
          >
            Guardar reseña
          </button>
        </form>
        {item.reviews.length > 0 && (
          <div className="border-t border-gray-100 pt-4 space-y-3">
            {item.reviews.map((r) => (
              <div key={r.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{r.user.name}</span>
                  <Stars value={r.rating} />
                </div>
                {r.text && <p className="text-xs text-gray-500">{r.text}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Pending card ─────────────────────────────────────────────────────────────

function PendingCard({
  item,
  myId,
  onVote,
}: {
  item: WatchItem;
  myId: string;
  onVote: (item: WatchItem) => void;
}) {
  const myVote = item.votes.find((v) => v.userId === myId);
  const [voting, setVoting] = useState(false);

  async function vote(want: boolean) {
    if (voting) return;
    setVoting(true);
    const res = await fetch(`/api/watchlist/${item.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ want }),
    });
    if (res.ok) onVote((await res.json()).item);
    setVoting(false);
  }

  return (
    <div className="border border-gray-100 rounded-2xl p-4 space-y-3">
      <div className="flex gap-3">
        <Poster src={item.coverUrl} title={item.title} size="md" />
        <div className="flex-1 min-w-0 space-y-1">
          <p className="font-medium text-sm leading-tight">{item.title}</p>
          <p className="text-xs text-gray-400">
            {TYPE_LABEL[item.type]}{item.year ? ` · ${item.year}` : ""}
            {item.platform ? ` · ${item.platform}` : ""}
          </p>
          <TrailerBtn url={item.trailerUrl} />
          {myVote !== undefined && (
            <span className="text-sm">{myVote.want ? "✅ Querés verla" : "❌ No tanto"}</span>
          )}
        </div>
      </div>

      {item.description && (
        <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => vote(true)}
          disabled={voting}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            myVote?.want
              ? "bg-green-100 text-green-700 border border-green-200"
              : "border border-gray-200 text-gray-600 hover:bg-green-50 hover:border-green-200 hover:text-green-600"
          }`}
        >
          👍 Quiero verla
        </button>
        <button
          onClick={() => vote(false)}
          disabled={voting}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            myVote !== undefined && !myVote.want
              ? "bg-red-50 text-red-600 border border-red-200"
              : "border border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-500"
          }`}
        >
          👎 No tanto
        </button>
      </div>

      <p className="text-xs text-gray-400 text-right">Agregada por {item.addedByUser.name}</p>
    </div>
  );
}

// ─── Bucket ───────────────────────────────────────────────────────────────────

function BucketSection({ items, onWatch }: { items: WatchItem[]; onWatch: (item: WatchItem) => void }) {
  const [picked, setPicked] = useState<WatchItem | null>(null);
  const [spinning, setSpinning] = useState(false);

  function spin() {
    if (items.length === 0) return;
    setSpinning(true);
    setPicked(null);
    let count = 0;
    const max = 12 + Math.floor(Math.random() * 8);
    const id = setInterval(() => {
      setPicked(items[Math.floor(Math.random() * items.length)]);
      count++;
      if (count >= max) {
        clearInterval(id);
        setSpinning(false);
      }
    }, 80);
  }

  async function markWatched(item: WatchItem, skip = false) {
    const res = await fetch(`/api/watchlist/${item.id}/watch`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skip }),
    });
    if (res.ok) {
      onWatch((await res.json()).item);
      setPicked(null);
    }
  }

  return (
    <div className="space-y-4">
      {items.length > 1 && (
        <div className="border border-amber-200 rounded-2xl p-4 space-y-3 bg-amber-50">
          <p className="text-xs text-center text-amber-700 font-medium uppercase tracking-widest">
            Ruleta de esta noche
          </p>
          <button
            onClick={spin}
            disabled={spinning}
            className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
          >
            {spinning ? "🎰 Girando…" : "🎲 ¿Qué vemos hoy?"}
          </button>
          {picked && (
            <div className="flex gap-3 items-center pt-1">
              <Poster src={picked.coverUrl} title={picked.title} size="md" />
              <div className="flex-1 space-y-1.5">
                <p className="font-bold text-base leading-tight">{picked.title}</p>
                <p className="text-xs text-gray-500">
                  {TYPE_LABEL[picked.type]}{picked.platform ? ` · ${picked.platform}` : ""}
                </p>
                <TrailerBtn url={picked.trailerUrl} />
                {!spinning && (
                  <button
                    onClick={() => markWatched(picked)}
                    className="mt-1 bg-black text-white text-xs rounded-lg px-3 py-1.5"
                  >
                    ✓ La vimos
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {items.map((item) => (
        <div key={item.id} className="border border-gray-100 rounded-2xl p-4 space-y-3">
          <div className="flex gap-3">
            <Poster src={item.coverUrl} title={item.title} size="md" />
            <div className="flex-1 min-w-0 space-y-1">
              <p className="font-medium text-sm">{item.title}</p>
              <p className="text-xs text-gray-400">
                {TYPE_LABEL[item.type]}{item.year ? ` · ${item.year}` : ""}
                {item.platform ? ` · ${item.platform}` : ""}
              </p>
              <TrailerBtn url={item.trailerUrl} />
              <span className="text-xs text-green-600 font-medium">💚 Los dos quieren verla</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => markWatched(item)}
              className="flex-1 py-2 border border-gray-200 rounded-xl text-xs text-gray-600 hover:bg-gray-50"
            >
              ✓ La vimos
            </button>
            <button
              onClick={() => markWatched(item, true)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-400 hover:bg-gray-50"
            >
              Saltar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Watched item ─────────────────────────────────────────────────────────────

function WatchedItem({
  item,
  myId,
  onReviewSaved,
}: {
  item: WatchItem;
  myId: string;
  onReviewSaved: (itemId: string, review: Review) => void;
}) {
  const [reviewing, setReviewing] = useState(false);
  const myReview = item.reviews.find((r) => r.userId === myId) ?? null;

  return (
    <>
      <div className="border border-gray-100 rounded-2xl p-4 space-y-3">
        <div className="flex gap-3">
          <Poster src={item.coverUrl} title={item.title} size="md" />
          <div className="flex-1 min-w-0 space-y-1">
            <p className="font-medium text-sm">{item.title}</p>
            <p className="text-xs text-gray-400">
              {TYPE_LABEL[item.type]}{item.year ? ` · ${item.year}` : ""}
            </p>
            <TrailerBtn url={item.trailerUrl} />
            {item.status === "SKIPPED" && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                Saltada
              </span>
            )}
          </div>
        </div>

        {item.reviews.length > 0 && (
          <div className="space-y-2 border-t border-gray-50 pt-2">
            {item.reviews.map((r) => (
              <div key={r.id} className="flex items-start gap-2">
                <span className="text-xs text-gray-500 w-20 flex-shrink-0 pt-0.5">{r.user.name}</span>
                <div className="space-y-0.5">
                  <Stars value={r.rating} />
                  {r.text && <p className="text-xs text-gray-500">{r.text}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => setReviewing(true)} className="text-xs text-gray-400 underline">
          {myReview ? "Editar mi reseña" : "Agregar reseña"}
        </button>
      </div>

      {reviewing && (
        <ReviewModal
          item={item}
          myReview={myReview}
          onSave={(review) => {
            onReviewSaved(item.id, review);
            setReviewing(false);
          }}
          onClose={() => setReviewing(false)}
        />
      )}
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function WatchlistClient({
  initialItems,
  myId,
}: {
  initialItems: WatchItem[];
  myId: string;
}) {
  const [items, setItems] = useState<WatchItem[]>(initialItems);
  const [tab, setTab] = useState<Tab>("pending");

  function updateItem(updated: WatchItem) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  function handleReviewSaved(itemId: string, review: Review) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const reviews = item.reviews.filter((r) => r.userId !== review.userId);
        return { ...item, reviews: [...reviews, review] };
      })
    );
  }

  const pending = items.filter((i) => i.status === "PENDING");
  const bucket = items.filter((i) => i.status === "BUCKET");
  const watched = items.filter((i) => i.status === "WATCHED" || i.status === "SKIPPED");

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "pending", label: "Pendientes", count: pending.length },
    { key: "bucket", label: "Bucket 💚", count: bucket.length },
    { key: "watched", label: "Vistos", count: watched.length },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-xl font-semibold">Watchlist</h1>
      </div>

      <div className="flex border-b border-gray-100 px-4">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-3 text-xs font-medium transition-colors border-b-2 -mb-px ${
              tab === key
                ? "border-black text-black"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {label}
            {count > 0 && (
              <span
                className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                  tab === key ? "bg-black text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto pb-24">
        {tab === "pending" && (
          <>
            <AddItemForm onAdd={(item) => setItems((prev) => [item, ...prev])} />
            {pending.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">
                Agreguen algo para votar.
              </p>
            )}
            {pending.map((item) => (
              <PendingCard key={item.id} item={item} myId={myId} onVote={updateItem} />
            ))}
          </>
        )}

        {tab === "bucket" && (
          <>
            {bucket.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">
                El bucket está vacío.
                <br />
                Voten sí los dos en un título.
              </p>
            ) : (
              <BucketSection items={bucket} onWatch={updateItem} />
            )}
          </>
        )}

        {tab === "watched" && (
          <>
            {watched.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">
                Todavía no marcaron nada como visto.
              </p>
            ) : (
              watched.map((item) => (
                <WatchedItem
                  key={item.id}
                  item={item}
                  myId={myId}
                  onReviewSaved={handleReviewSaved}
                />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
