import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import WatchlistClient from "./_components/WatchlistClient";

export default async function WatchlistPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const membership = await prisma.groupMember.findFirst({
    where: { userId: session.user.id },
    select: { groupId: true },
  });

  const items = membership
    ? await prisma.watchlistItem.findMany({
        where: { groupId: membership.groupId },
        include: {
          addedByUser: { select: { id: true, name: true } },
          votes: { select: { userId: true, want: true } },
          reviews: { include: { user: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return <WatchlistClient initialItems={items} myId={session.user.id} />;
}
