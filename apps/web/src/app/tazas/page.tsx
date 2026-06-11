import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_MOODS } from "@couple/shared";
import TazasClient from "./_components/TazasClient";

export default async function TazasPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  // Seed defaults si no tiene moods
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
                user: {
                  select: { name: true, currentMoodId: true, currentMood: true },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  const partnerMember = membership?.group.members[0];
  const partner = partnerMember
    ? {
        name: partnerMember.user.name,
        currentMood: partnerMember.user.currentMood ?? null,
      }
    : null;

  return (
    <TazasClient
      initial={{
        moods,
        currentMoodId: user?.currentMoodId ?? null,
        partner,
      }}
    />
  );
}
