import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CopyInviteLink from "./_components/CopyInviteLink";

export default async function InvitePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/sign-in");

  const membership = await prisma.groupMember.findFirst({
    where: { userId: session.user.id },
    include: { group: true },
  });

  if (!membership) redirect("/");

  const { group } = membership;
  const partnerCount = await prisma.groupMember.count({
    where: { groupId: group.id },
  });

  if (partnerCount >= 2) redirect("/");

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/join/${group.inviteCode}`;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Invitá a tu pareja</h1>
          <p className="text-sm text-gray-500">
            Compartí este link para que pueda unirse a tu espacio.
          </p>
        </div>

        <CopyInviteLink inviteUrl={inviteUrl} />

        <p className="text-xs text-gray-400">
          Una vez que tu pareja se una, el link va a dejar de funcionar.
        </p>
      </div>
    </div>
  );
}
