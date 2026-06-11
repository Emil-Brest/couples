import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { moodId } = await request.json();

  if (moodId !== null) {
    const mood = await prisma.moodState.findUnique({ where: { id: moodId } });
    if (!mood || mood.userId !== session.user.id) {
      return NextResponse.json({ error: "Mood inválido" }, { status: 400 });
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { currentMoodId: moodId ?? null },
  });

  return NextResponse.json({ ok: true });
}
