import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/sign-in");

  const membership = await prisma.groupMember.findFirst({
    where: { userId: session.user.id },
    include: {
      group: {
        include: { members: { include: { user: true } } },
      },
    },
  });

  if (!membership) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-semibold">Hola, {session.user.name}</h1>
          <p className="text-sm text-gray-500">
            Todavía no pertenecés a ningún grupo.
          </p>
          <Link
            href="/invite"
            className="inline-block bg-black text-white rounded-md px-4 py-2 text-sm font-medium"
          >
            Crear espacio
          </Link>
        </div>
      </div>
    );
  }

  const partner = membership.group.members.find(
    (m) => m.userId !== session.user.id
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-xl font-semibold">
          Hola, {session.user.name}
        </h1>

        {partner ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Conectado/a con <strong>{partner.user.name}</strong>
            </p>
            <Link
              href="/tazas"
              className="inline-block bg-black text-white rounded-md px-4 py-2 text-sm font-medium"
            >
              Ver tazas
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              Tu pareja todavía no se unió.
            </p>
            <Link href="/invite" className="inline-block text-sm underline text-black">
              Ver link de invitación
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
