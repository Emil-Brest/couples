import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_MOODS } from "@couple/shared";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  let moods = await prisma.moodState.findMany({
    where: { userId: session.user.id },
    orderBy: { order: "asc" },
  });

  // Seed defaults si el usuario no tiene moods todavía
  if (moods.length === 0) {
    await prisma.moodState.createMany({
      data: DEFAULT_MOODS.map((m) => ({ ...m, userId: session.user.id, isDefault: true })),
    });
    moods = await prisma.moodState.findMany({
      where: { userId: session.user.id },
      orderBy: { order: "asc" },
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { currentMoodId: true },
  });

  // Busca la pareja en el mismo grupo
  const membership = await prisma.groupMember.findFirst({
    where: { userId: session.user.id },
    include: {
      group: {
        include: {
          members: {
            where: { userId: { not: session.user.id } },
            include: {
              user: {
                select: {
                  name: true,
                  currentMoodId: true,
                  currentMood: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const partnerMember = membership?.group.members[0];
  const partner = partnerMember
    ? {
        name: partnerMember.user.name,
        currentMood: partnerMember.user.currentMood ?? null,
      }
    : null;

  return NextResponse.json({
    moods,
    currentMoodId: user?.currentMoodId ?? null,
    partner,
  });
}
