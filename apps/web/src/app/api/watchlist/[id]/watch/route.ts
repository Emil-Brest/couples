import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const skip = body?.skip === true;

  const item = await prisma.watchlistItem.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const membership = await prisma.groupMember.findFirst({
    where: { userId: session.user.id, groupId: item.groupId },
  });
  if (!membership) return NextResponse.json({ error: "Sin acceso" }, { status: 403 });

  const updated = await prisma.watchlistItem.update({
    where: { id },
    data: {
      status: skip ? "SKIPPED" : "WATCHED",
      watchedAt: skip ? null : new Date(),
    },
    include: {
      addedByUser: { select: { id: true, name: true } },
      votes: { select: { userId: true, want: true } },
      reviews: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  return NextResponse.json({ item: updated });
}
