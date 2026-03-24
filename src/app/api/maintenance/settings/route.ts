import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const society = await prisma.society.findUnique({
    where: { id: session.societyId },
  });

  return Response.json({ society });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const society = await prisma.society.update({
      where: { id: session.societyId },
      data: {
        name: body.name,
        address: body.address,
        city: body.city,
        pincode: body.pincode,
        upiId: body.upiId || null,
        bankDetails: body.bankDetails || null,
        maintenanceAmt: body.maintenanceAmt ? parseFloat(body.maintenanceAmt) : undefined,
        dueDayOfMonth: body.dueDayOfMonth ? parseInt(body.dueDayOfMonth) : undefined,
        lateFee: body.lateFee ? parseFloat(body.lateFee) : 0,
      },
    });

    return Response.json({ society });
  } catch {
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
