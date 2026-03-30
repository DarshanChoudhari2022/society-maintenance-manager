import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { flatNumber, vehicleNo, isAssigned } = body;

    let flatId = null;
    if (flatNumber) {
      const flat = await prisma.flat.findFirst({
        where: { societyId: session.societyId, flatNumber },
      });
      flatId = flat?.id || null;
    }

    const slot = await prisma.parkingSlot.update({
      where: { id },
      data: {
        flatId: isAssigned === false ? null : flatId,
        isAssigned: isAssigned !== undefined ? isAssigned : !!flatNumber,
        vehicleNo: isAssigned === false ? null : (vehicleNo || null),
      },
    });
    return Response.json({ slot });
  } catch {
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.parkingSlot.delete({ where: { id } });
  return Response.json({ success: true });
}
