import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

interface Props {
  params: Promise<{ inviteCode: string }>;
}

export default async function JoinPage({ params }: Props) {
  const { inviteCode } = await params;

  const group = await prisma.group.findUnique({ where: { inviteCode } });

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-semibold">Link inválido</h1>
          <p className="text-sm text-gray-500">
            Este link de invitación no existe o ya fue usado.
          </p>
        </div>
      </div>
    );
  }

  const memberCount = await prisma.groupMember.count({
    where: { groupId: group.id },
  });

  if (memberCount >= 2) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-semibold">Grupo completo</h1>
          <p className="text-sm text-gray-500">
            Este grupo ya tiene dos integrantes.
          </p>
        </div>
      </div>
    );
  }

  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    const alreadyMember = await prisma.groupMember.findFirst({
      where: { userId: session.user.id, groupId: group.id },
    });

    if (!alreadyMember) {
      await prisma.groupMember.create({
        data: { userId: session.user.id, groupId: group.id, role: "MEMBER" },
      });
    }

    redirect("/");
  }

  redirect(`/sign-up?invite=${inviteCode}`);
}
