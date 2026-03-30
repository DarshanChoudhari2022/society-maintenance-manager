import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slots = await prisma.parkingSlot.findMany({
    where: { societyId: session.societyId },
    include: { flat: true },
    orderBy: { slotNumber: "asc" },
  });

  const stats = {
    total: slots.length,
    assigned: slots.filter((s) => s.isAssigned).length,
    available: slots.filter((s) => !s.isAssigned).length,
  };

  return Response.json({ slots, stats });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slotNumber, slotType, wing, flatNumber, vehicleNo } = body;

    if (!slotNumber) {
      return Response.json({ error: "Slot number is required" }, { status: 400 });
    }

    let flatId = null;
    if (flatNumber) {
      const flat = await prisma.flat.findFirst({
        where: { societyId: session.societyId, flatNumber },
      });
      flatId = flat?.id || null;
    }

    const slot = await prisma.parkingSlot.create({
      data: {
        societyId: session.societyId,
        slotNumber,
        slotType: slotType || "car",
        wing: wing || null,
        flatId,
        isAssigned: !!flatNumber,
        vehicleNo: vehicleNo || null,
      },
    });

    return Response.json({ slot }, { status: 201 });
  } catch {
    return Response.json({ error: "Slot number may already exist" }, { status: 500 });
  }
}
