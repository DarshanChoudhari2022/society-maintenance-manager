import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/complaints/[id]">
) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await request.json();

  const complaint = await prisma.complaint.findFirst({
    where: { id, societyId: session.societyId },
  });

  if (!complaint) {
    return Response.json({ error: "Complaint not found" }, { status: 404 });
  }

  const updated = await prisma.complaint.update({
    where: { id },
    data: {
      status: body.status || complaint.status,
      resolution: body.resolution ?? complaint.resolution,
      resolvedAt: body.status === "resolved" || body.status === "closed" ? new Date() : complaint.resolvedAt,
    },
  });

  return Response.json({ complaint: updated });
}

export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<"/api/complaints/[id]">
) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  await prisma.complaint.deleteMany({
    where: { id, societyId: session.societyId },
  });

  return Response.json({ success: true });
}
