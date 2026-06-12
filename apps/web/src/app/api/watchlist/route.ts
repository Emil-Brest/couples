import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const membership = await prisma.groupMember.findFirst({
    where: { userId: session.user.id },
    select: { groupId: true },
  });
  if (!membership) return NextResponse.json({ items: [] });

  const items = await prisma.watchlistItem.findMany({
    where: { groupId: membership.groupId },
    include: {
      addedByUser: { select: { id: true, name: true } },
      votes: { select: { userId: true, want: true } },
      reviews: { include: { user: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const membership = await prisma.groupMember.findFirst({
    where: { userId: session.user.id },
    select: { groupId: true },
  });
  if (!membership) return NextResponse.json({ error: "Sin grupo" }, { status: 400 });

  const { title, type, platform, coverUrl, trailerUrl, description, year, tmdbId } = await request.json();
  if (!title?.trim()) return NextResponse.json({ error: "Título requerido" }, { status: 400 });

  const item = await prisma.watchlistItem.create({
    data: {
      title: title.trim(),
      type: type ?? "MOVIE",
      platform,
      coverUrl,
      trailerUrl,
      description,
      year,
      tmdbId,
      addedById: session.user.id,
      groupId: membership.groupId,
    },
    include: {
      addedByUser: { select: { id: true, name: true } },
      votes: { select: { userId: true, want: true } },
      reviews: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}
