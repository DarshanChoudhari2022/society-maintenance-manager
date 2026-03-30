import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<"/api/notices/[id]">
) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  await prisma.notice.deleteMany({
    where: { id, societyId: session.societyId },
  });

  return Response.json({ success: true });
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/notices/[id]">
) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await request.json();

  const updated = await prisma.notice.update({
    where: { id },
    data: {
      isPinned: body.isPinned ?? undefined,
    },
  });

  return Response.json({ notice: updated });
}
