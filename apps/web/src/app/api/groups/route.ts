import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const existing = await prisma.groupMember.findFirst({
    where: { userId: session.user.id },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Ya pertenecés a un grupo" },
      { status: 400 }
    );
  }

  const group = await prisma.group.create({
    data: {
      type: "COUPLE",
      members: {
        create: { userId: session.user.id, role: "ADMIN" },
      },
    },
  });

  return NextResponse.json({ group });
}
