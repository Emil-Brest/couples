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
  const { want } = await request.json();
  if (typeof want !== "boolean") return NextResponse.json({ error: "want requerido" }, { status: 400 });

  const item = await prisma.watchlistItem.findUnique({
    where: { id },
    include: { votes: true },
  });
  if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const membership = await prisma.groupMember.findFirst({
    where: { userId: session.user.id, groupId: item.groupId },
  });
  if (!membership) return NextResponse.json({ error: "Sin acceso" }, { status: 403 });

  await prisma.watchVote.upsert({
    where: { itemId_userId: { itemId: id, userId: session.user.id } },
    create: { itemId: id, userId: session.user.id, want },
    update: { want },
  });

  // Check if both members voted yes → promote to BUCKET
  const groupMembers = await prisma.groupMember.findMany({
    where: { groupId: item.groupId },
    select: { userId: true },
  });

  if (groupMembers.length === 2 && want) {
    const allVotes = await prisma.watchVote.findMany({ where: { itemId: id } });
    const allWant = groupMembers.every((m) =>
      allVotes.some((v) => v.userId === m.userId && v.want)
    );
    if (allWant) {
      await prisma.watchlistItem.update({
        where: { id },
        data: { status: "BUCKET" },
      });
    }
  }

  // If someone votes no → stays PENDING, remove BUCKET if it was set
  if (!want && item.status === "BUCKET") {
    await prisma.watchlistItem.update({
      where: { id },
      data: { status: "PENDING" },
    });
  }

  const updated = await prisma.watchlistItem.findUnique({
    where: { id },
    include: {
      addedByUser: { select: { id: true, name: true } },
      votes: { select: { userId: true, want: true } },
      reviews: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  return NextResponse.json({ item: updated });
}
