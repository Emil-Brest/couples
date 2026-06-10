import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { inviteCode } = await request.json();

  if (!inviteCode) {
    return NextResponse.json({ error: "Código requerido" }, { status: 400 });
  }

  const group = await prisma.group.findUnique({ where: { inviteCode } });

  if (!group) {
    return NextResponse.json(
      { error: "Código inválido o expirado" },
      { status: 404 }
    );
  }

  const memberCount = await prisma.groupMember.count({
    where: { groupId: group.id },
  });

  if (memberCount >= 2) {
    return NextResponse.json(
      { error: "Este grupo ya está completo" },
      { status: 400 }
    );
  }

  const alreadyMember = await prisma.groupMember.findFirst({
    where: { userId: session.user.id, groupId: group.id },
  });

  if (alreadyMember) {
    return NextResponse.json({ group });
  }

  await prisma.groupMember.create({
    data: { userId: session.user.id, groupId: group.id, role: "MEMBER" },
  });

  return NextResponse.json({ group });
}
