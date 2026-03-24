import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentPeriod } from "@/lib/utils";

export async function GET() {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const period = getCurrentPeriod();
  const societyId = session.societyId;

  // Get bills for current period
  const bills = await prisma.maintenanceBill.findMany({
    where: { societyId, period },
    include: { flat: true },
    orderBy: { updatedAt: "desc" },
  });

  const paidBills = bills.filter((b) => b.status === "paid");
  const pendingBills = bills.filter((b) => b.status === "pending");

  // Get active flats count
  const activeFlats = await prisma.flat.count({
    where: { societyId, isActive: true },
  });

  // Recent activity (last 10)
  const recentActivity = bills.slice(0, 10).map((b) => ({
    id: b.id,
    flatNumber: b.flat.flatNumber,
    ownerName: b.flat.ownerName,
    amount: b.amount,
    status: b.status,
    paidVia: b.paidVia,
    paidAt: b.paidAt?.toISOString() || null,
    updatedAt: b.updatedAt.toISOString(),
  }));

  return Response.json({
    totalCollected: paidBills.reduce((sum, b) => sum + (b.paidAmount || b.amount), 0),
    pendingAmount: pendingBills.reduce((sum, b) => sum + b.amount, 0),
    totalMembers: activeFlats,
    paidCount: paidBills.length,
    pendingCount: pendingBills.length,
    totalFlats: activeFlats,
    recentActivity,
    period,
  });
}
