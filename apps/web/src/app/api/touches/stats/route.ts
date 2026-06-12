import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function startOf(unit: "day" | "month"): Date {
  const now = new Date();
  if (unit === "day") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const membership = await prisma.groupMember.findFirst({
    where: { userId: session.user.id },
    select: { groupId: true },
  });

  if (!membership) {
    return NextResponse.json({ today: null, month: null });
  }

  const { groupId } = membership;
  const myId = session.user.id;

  const [todayTouches, monthTouches] = await Promise.all([
    prisma.touch.findMany({
      where: { groupId, createdAt: { gte: startOf("day") } },
      select: { senderId: true },
    }),
    prisma.touch.findMany({
      where: { groupId, createdAt: { gte: startOf("month") } },
      select: { senderId: true },
    }),
  ]);

  function summarize(touches: { senderId: string }[]) {
    return {
      total: touches.length,
      mine: touches.filter((t) => t.senderId === myId).length,
      partner: touches.filter((t) => t.senderId !== myId).length,
    };
  }

  return NextResponse.json({
    today: summarize(todayTouches),
    month: summarize(monthTouches),
  });
}
