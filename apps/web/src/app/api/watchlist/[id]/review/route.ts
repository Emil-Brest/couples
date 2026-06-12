import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const { rating, text } = await request.json();

  if (!rating || typeof rating !== "number" || rating < 1 || rating > 10) {
    return NextResponse.json({ error: "Rating 1–10 requerido" }, { status: 400 });
  }

  const item = await prisma.watchlistItem.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const membership = await prisma.groupMember.findFirst({
    where: { userId: session.user.id, groupId: item.groupId },
  });
  if (!membership) return NextResponse.json({ error: "Sin acceso" }, { status: 403 });

  const review = await prisma.watchReview.upsert({
    where: { itemId_userId: { itemId: id, userId: session.user.id } },
    create: { itemId: id, userId: session.user.id, rating, text: text ?? null },
    update: { rating, text: text ?? null },
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ review });
}
