import { getSession } from "@/lib/auth";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { society: true },
  });

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      societyId: user.societyId,
      society: user.society,
    },
  });
}
