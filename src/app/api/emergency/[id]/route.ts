import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.emergencyContact.delete({ where: { id } });
  return Response.json({ success: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const contact = await prisma.emergencyContact.update({
    where: { id },
    data: {
      name: body.name,
      phone: body.phone,
      category: body.category,
      address: body.address || null,
      notes: body.notes || null,
      isAvailable: body.isAvailable !== undefined ? body.isAvailable : true,
    },
  });

  return Response.json({ contact });
}
