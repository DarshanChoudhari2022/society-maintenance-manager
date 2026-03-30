import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "";
  const date = searchParams.get("date") || "";

  const where: Record<string, unknown> = { societyId: session.societyId };
  if (status) where.status = status;
  if (date) {
    const d = new Date(date);
    where.entryTime = {
      gte: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
      lt: new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1),
    };
  }

  const visitors = await prisma.visitor.findMany({
    where,
    orderBy: { entryTime: "desc" },
    take: 100,
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const stats = {
    todayTotal: await prisma.visitor.count({
      where: { societyId: session.societyId, entryTime: { gte: todayStart } },
    }),
    currentlyIn: await prisma.visitor.count({
      where: { societyId: session.societyId, status: "in" },
    }),
  };

  return Response.json({ visitors, stats });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { flatNumber, visitorName, phone, purpose, vehicleNo, notes } = body;

    if (!flatNumber || !visitorName || !purpose) {
      return Response.json({ error: "Flat number, visitor name, and purpose are required" }, { status: 400 });
    }

    // Try to find flat
    const flat = await prisma.flat.findFirst({
      where: { societyId: session.societyId, flatNumber },
    });

    const visitor = await prisma.visitor.create({
      data: {
        societyId: session.societyId,
        flatId: flat?.id || null,
        flatNumber,
        visitorName,
        phone: phone || null,
        purpose,
        vehicleNo: vehicleNo || null,
        approvedBy: session.name,
        notes: notes || null,
      },
    });

    return Response.json({ visitor }, { status: 201 });
  } catch {
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
