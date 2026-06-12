import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_MOODS } from "@couple/shared";
import TazasClient from "./_components/TazasClient";

function startOf(unit: "day" | "month"): Date {
  const now = new Date();
  if (unit === "day") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export default async function TazasPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const moodCount = await prisma.moodState.count({ where: { userId: session.user.id } });
  if (moodCount === 0) {
    await prisma.moodState.createMany({
      data: DEFAULT_MOODS.map((m) => ({ ...m, userId: session.user.id, isDefault: true })),
    });
  }

  const [moods, user, membership] = await Promise.all([
    prisma.moodState.findMany({
      where: { userId: session.user.id },
      orderBy: { order: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { currentMoodId: true },
    }),
    prisma.groupMember.findFirst({
      where: { userId: session.user.id },
      include: {
        group: {
          include: {
            members: {
              where: { userId: { not: session.user.id } },
              include: {
                user: { select: { name: true, currentMoodId: true, currentMood: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  const groupId = membership?.groupId;
  const myId = session.user.id;

  const [todayTouches, monthTouches] = groupId
    ? await Promise.all([
        prisma.touch.findMany({
          where: { groupId, createdAt: { gte: startOf("day") } },
          select: { senderId: true },
        }),
        prisma.touch.findMany({
          where: { groupId, createdAt: { gte: startOf("month") } },
          select: { senderId: true },
        }),
      ])
    : [[], []];

  function summarize(touches: { senderId: string }[]) {
    return {
      total: touches.length,
      mine: touches.filter((t) => t.senderId === myId).length,
      partner: touches.filter((t) => t.senderId !== myId).length,
    };
  }

  const partnerMember = membership?.group.members[0];
  const partner = partnerMember
    ? { name: partnerMember.user.name, currentMood: partnerMember.user.currentMood ?? null }
    : null;

  return (
    <TazasClient
      initial={{ moods, currentMoodId: user?.currentMoodId ?? null, partner }}
      initialTouches={{
        today: groupId ? summarize(todayTouches) : null,
        month: groupId ? summarize(monthTouches) : null,
      }}
    />
  );
}
