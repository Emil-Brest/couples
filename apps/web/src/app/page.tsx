import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ProfileClient from "./_components/ProfileClient";

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const membership = await prisma.groupMember.findFirst({
    where: { userId: session.user.id },
    include: {
      group: {
        select: {
          inviteCode: true,
          members: { include: { user: { select: { id: true, name: true } } } },
        },
      },
    },
  });

  const partner = membership?.group.members.find(
    (m) => m.userId !== session.user.id
  )?.user ?? null;

  const inviteUrl = membership
    ? `${process.env.NEXT_PUBLIC_APP_URL}/join/${membership.group.inviteCode}`
    : null;

  return (
    <ProfileClient
      user={{ name: session.user.name, email: session.user.email }}
      partner={partner}
      inviteUrl={inviteUrl}
    />
  );
}
