import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const membership = await prisma.groupMember.findFirst({
    where: { userId: session.user.id },
  });

  if (!membership) {
    return NextResponse.json({ error: "No pertenecés a ningún grupo" }, { status: 400 });
  }

  await prisma.touch.create({
    data: { senderId: session.user.id, groupId: membership.groupId },
  });

  return NextResponse.json({ ok: true });
}
