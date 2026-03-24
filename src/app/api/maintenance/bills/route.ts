import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { getCurrentPeriod, generateReceiptNumber } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || getCurrentPeriod();
  const status = searchParams.get("status") || "all";
  const search = searchParams.get("search") || "";

  const where: Record<string, unknown> = {
    societyId: session.societyId,
    period,
  };

  if (status !== "all") {
    where.status = status;
  }

  if (search) {
    where.flat = {
      OR: [
        { flatNumber: { contains: search, mode: "insensitive" } },
        { ownerName: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  const bills = await prisma.maintenanceBill.findMany({
    where,
    include: { flat: true },
    orderBy: { flat: { flatNumber: "asc" } },
  });

  const allBills = await prisma.maintenanceBill.findMany({
    where: { societyId: session.societyId, period },
  });

  const paidBills = allBills.filter((b) => b.status === "paid");
  const pendingBills = allBills.filter((b) => b.status === "pending");

  return Response.json({
    bills,
    summary: {
      paid: paidBills.length,
      pending: pendingBills.length,
      total: allBills.length,
      collectedAmount: paidBills.reduce((s, b) => s + (b.paidAmount || b.amount), 0),
      pendingAmount: pendingBills.reduce((s, b) => s + b.amount, 0),
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { period } = await request.json();
    const targetPeriod = period || getCurrentPeriod();

    // Check if bills exist
    const existingCount = await prisma.maintenanceBill.count({
      where: { societyId: session.societyId, period: targetPeriod },
    });

    if (existingCount > 0) {
      return Response.json(
        { error: `Bills already exist for ${targetPeriod}`, existing: existingCount },
        { status: 400 }
      );
    }

    // Get society settings
    const society = await prisma.society.findUnique({
      where: { id: session.societyId },
    });

    if (!society) {
      return Response.json({ error: "Society not found" }, { status: 404 });
    }

    // Get active flats
    const activeFlats = await prisma.flat.findMany({
      where: { societyId: session.societyId, isActive: true },
    });

    // Calculate due date
    const [year, month] = targetPeriod.split("-").map(Number);
    const dueDate = new Date(year, month - 1, society.dueDayOfMonth);

    // Generate bills
    let generated = 0;
    for (const flat of activeFlats) {
      await prisma.maintenanceBill.create({
        data: {
          flatId: flat.id,
          societyId: session.societyId,
          amount: society.maintenanceAmt,
          period: targetPeriod,
          dueDate,
        },
      });
      generated++;
    }

    return Response.json({ generated, skipped: 0 });
  } catch {
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
