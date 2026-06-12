import { NextRequest, NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";

type TmdbVideo = {
  site: string;
  type: string;
  key: string;
  official: boolean;
  published_at: string;
};

export async function GET(request: NextRequest) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return NextResponse.json({ trailerUrl: null });

  const tmdbId = request.nextUrl.searchParams.get("tmdbId");
  const mediaType = request.nextUrl.searchParams.get("mediaType"); // "movie" | "tv"

  if (!tmdbId || !mediaType) return NextResponse.json({ trailerUrl: null });

  const endpoint = mediaType === "tv" ? "tv" : "movie";
  const url = `${TMDB_BASE}/${endpoint}/${tmdbId}/videos?api_key=${apiKey}&language=es-AR`;
  const res = await fetch(url, {});

  if (!res.ok) return NextResponse.json({ trailerUrl: null });

  const data = await res.json();
  const videos: TmdbVideo[] = data.results ?? [];

  // Prefer: official trailer in Spanish, then any trailer, then any YouTube video
  const pick =
    videos.find((v) => v.site === "YouTube" && v.type === "Trailer" && v.official) ??
    videos.find((v) => v.site === "YouTube" && v.type === "Trailer") ??
    videos.find((v) => v.site === "YouTube");

  if (!pick) {
    // Fallback: fetch English videos
    const urlEn = `${TMDB_BASE}/${endpoint}/${tmdbId}/videos?api_key=${apiKey}&language=en-US`;
    const resEn = await fetch(urlEn, {});
    if (resEn.ok) {
      const dataEn = await resEn.json();
      const videosEn: TmdbVideo[] = dataEn.results ?? [];
      const pickEn =
        videosEn.find((v) => v.site === "YouTube" && v.type === "Trailer" && v.official) ??
        videosEn.find((v) => v.site === "YouTube" && v.type === "Trailer") ??
        videosEn.find((v) => v.site === "YouTube");
      if (pickEn) {
        return NextResponse.json({ trailerUrl: `https://www.youtube.com/watch?v=${pickEn.key}` });
      }
    }
    return NextResponse.json({ trailerUrl: null });
  }

  return NextResponse.json({ trailerUrl: `https://www.youtube.com/watch?v=${pick.key}` });
}
