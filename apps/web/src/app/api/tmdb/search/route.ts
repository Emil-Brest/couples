import { NextRequest, NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w300";

type TmdbResult = {
  id: number;
  media_type: "movie" | "tv" | "person";
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  overview?: string;
};

export async function GET(request: NextRequest) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "TMDB_API_KEY no configurada" }, { status: 503 });

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const url = `${TMDB_BASE}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(q)}&language=es-AR&include_adult=false&page=1`;
  const res = await fetch(url, { next: { revalidate: 60 } });

  if (!res.ok) return NextResponse.json({ error: "Error TMDB" }, { status: 502 });

  const data = await res.json();

  const results = (data.results as TmdbResult[])
    .filter((r) => r.media_type === "movie" || r.media_type === "tv")
    .slice(0, 8)
    .map((r) => ({
      tmdbId: r.id,
      title: r.title ?? r.name ?? "",
      mediaType: r.media_type === "movie" ? "MOVIE" : "SERIES",
      year: r.release_date
        ? parseInt(r.release_date.substring(0, 4))
        : r.first_air_date
        ? parseInt(r.first_air_date.substring(0, 4))
        : null,
      poster: r.poster_path ? `${IMG_BASE}${r.poster_path}` : null,
      overview: r.overview || null,
    }));

  return NextResponse.json({ results });
}
