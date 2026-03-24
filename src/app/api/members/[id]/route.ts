import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/members/[id]">
) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const member = await prisma.flat.findFirst({
    where: { id, societyId: session.societyId },
  });

  if (!member) {
    return Response.json({ error: "Member not found" }, { status: 404 });
  }

  return Response.json({ member });
}

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/members/[id]">
) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await request.json();

  // Check member exists and belongs to this society
  const existing = await prisma.flat.findFirst({
    where: { id, societyId: session.societyId },
  });

  if (!existing) {
    return Response.json({ error: "Member not found" }, { status: 404 });
  }

  // Check for duplicate flat number if changed
  if (body.flatNumber && body.flatNumber !== existing.flatNumber) {
    const duplicate = await prisma.flat.findFirst({
      where: {
        societyId: session.societyId,
        flatNumber: body.flatNumber,
        id: { not: id },
      },
    });
    if (duplicate) {
      return Response.json(
        { error: `Flat number ${body.flatNumber} already exists` },
        { status: 400 }
      );
    }
  }

  const member = await prisma.flat.update({
    where: { id },
    data: {
      flatNumber: body.flatNumber ?? existing.flatNumber,
      wing: body.wing ?? existing.wing,
      floor: body.floor !== undefined ? (body.floor ? parseInt(body.floor) : null) : existing.floor,
      ownerName: body.ownerName ?? existing.ownerName,
      tenantName: body.tenantName ?? existing.tenantName,
      contact: body.contact ?? existing.contact,
      email: body.email ?? existing.email,
      vehicleNumber: body.vehicleNumber ?? existing.vehicleNumber,
      isActive: body.isActive ?? existing.isActive,
    },
  });

  return Response.json({ member });
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/members/[id]">
) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  // Soft delete - set isActive to false
  await prisma.flat.update({
    where: { id },
    data: { isActive: false },
  });

  // Update society totalFlats
  const flatCount = await prisma.flat.count({
    where: { societyId: session.societyId, isActive: true },
  });
  await prisma.society.update({
    where: { id: session.societyId },
    data: { totalFlats: flatCount },
  });

  return Response.json({ success: true });
}
