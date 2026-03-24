import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "";

  const bills = await prisma.maintenanceBill.findMany({
    where: { societyId: session.societyId, period },
    include: { flat: true },
  });

  const paidBills = bills.filter((b) => b.status === "paid");
  const pendingBills = bills.filter((b) => b.status === "pending");

  // Payment method breakdown
  const methods: Record<string, { count: number; amount: number }> = {};
  for (const b of paidBills) {
    const via = b.paidVia || "other";
    if (!methods[via]) methods[via] = { count: 0, amount: 0 };
    methods[via].count++;
    methods[via].amount += b.paidAmount || b.amount;
  }

  return Response.json({
    summary: {
      totalFlats: bills.length,
      billsGenerated: bills.length,
      paid: paidBills.length,
      pending: pendingBills.length,
      totalCollected: paidBills.reduce((s, b) => s + (b.paidAmount || b.amount), 0),
      totalPending: pendingBills.reduce((s, b) => s + b.amount, 0),
      collectionRate: bills.length > 0 ? Math.round((paidBills.length / bills.length) * 100) : 0,
    },
    paymentMethodBreakdown: Object.entries(methods).map(([method, data]) => ({
      method,
      ...data,
    })),
    pendingFlats: pendingBills.map((b) => ({
      flatNumber: b.flat.flatNumber,
      ownerName: b.flat.ownerName,
      contact: b.flat.contact,
      amount: b.amount,
    })),
  });
}
