import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentPeriod } from "@/lib/utils";

export async function GET() {
  try {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Handle empty string societyId - try to look it up from user record
  let societyId = session.societyId;
  if (!societyId) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { societyId: true },
    });
    if (!user?.societyId) {
      return Response.json({ error: "No society associated" }, { status: 403 });
    }
    societyId = user.societyId;
  }

  const period = getCurrentPeriod();

  // Get society for opening balance (wrapped in try-catch in case schema is outdated)
  let society = null;
  try {
    society = await prisma.society.findUnique({ where: { id: societyId } });
  } catch {
    // Schema mismatch, ignore
  }

  // Get bills for current period
  const bills = await prisma.maintenanceBill.findMany({
    where: { societyId, period },
    include: { flat: true },
    orderBy: { updatedAt: "desc" },
  });

  const paidBills = bills.filter((b) => b.status === "paid");
  const partialBills = bills.filter((b) => b.status === "partial");
  const pendingBills = bills.filter((b) => b.status === "pending");

  // Get active flats count
  const activeFlats = await prisma.flat.count({
    where: { societyId, isActive: true },
  });

  // Get expenses for current month
  const [yearStr, monthStr] = period.split("-");
  const startDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
  const endDate = new Date(parseInt(yearStr), parseInt(monthStr), 0);
  
  const expenses = await prisma.expense.findMany({
    where: {
      societyId,
      paidOn: { gte: startDate, lte: endDate },
    },
  });
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // All-time totals for fund balance
  const allPaidBills = await prisma.maintenanceBill.findMany({
    where: { societyId, status: { in: ["paid", "partial"] } },
  });
  const allExpenses = await prisma.expense.findMany({ where: { societyId } });
  
  const totalIncome = allPaidBills.reduce((s, b) => s + (b.paidAmount || b.amount), 0);
  const totalAllExpenses = allExpenses.reduce((s, e) => s + e.amount, 0);
  const fundBalance = (society?.openingBalance || 0) + totalIncome - totalAllExpenses;

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

  const totalCollected = paidBills.reduce((sum, b) => sum + (b.paidAmount || b.amount), 0)
    + partialBills.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
  const pendingAmount = pendingBills.reduce((sum, b) => sum + b.amount, 0)
    + partialBills.reduce((sum, b) => sum + (b.amount - (b.paidAmount || 0)), 0);

  // Quick stats for new features
  const openComplaints = await prisma.complaint.count({
    where: { societyId, status: { in: ["open", "in_progress"] } },
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const visitorsToday = await prisma.visitor.count({
    where: { societyId, entryTime: { gte: todayStart } },
  }).catch(() => 0);

  const activePolls = await prisma.poll.count({
    where: { societyId, status: "active" },
  }).catch(() => 0);

  return Response.json({
    totalCollected,
    pendingAmount,
    totalExpenses,
    totalMembers: activeFlats,
    paidCount: paidBills.length,
    partialCount: partialBills.length,
    pendingCount: pendingBills.length,
    totalFlats: activeFlats,
    recentActivity,
    period,
    fundBalance,
    openComplaints,
    visitorsToday,
    activePolls,
  });
  } catch (error: unknown) {
    console.error("Dashboard API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
