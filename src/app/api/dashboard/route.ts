import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentPeriod } from "@/lib/utils";
import { cached } from "@/lib/api-cache";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const societyId = session.societyId;
    if (!societyId) {
      return Response.json({ error: "No society associated" }, { status: 403 });
    }

    const period = getCurrentPeriod();
    const cacheKey = `dashboard:${societyId}:${period}`;

    const data = await cached(cacheKey, async () => {
      // 1. Get society info for opening balance and total flats
      const society = await prisma.society.findUnique({
        where: { id: societyId },
        select: { openingBalance: true, totalFlats: true }
      });

      // 2. Optimized aggregations for bills (Current Period)
      const billStats = await prisma.maintenanceBill.groupBy({
        by: ['status'],
        where: { societyId, period },
        _sum: { amount: true, paidAmount: true },
        _count: { id: true }
      });

      // 3. Parallel fetch for count of active flats and quick stats
      const [totalMembers, openComplaints, todayVisitors, activePolls] = await Promise.all([
        prisma.flat.count({ where: { societyId, isActive: true } }),
        prisma.complaint.count({ where: { societyId, status: { in: ["open", "in_progress"] } } }),
        prisma.visitor.count({ 
          where: { 
            societyId, 
            entryTime: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } 
          } 
        }).catch(() => 0),
        prisma.poll.count({ where: { societyId, status: "active" } }).catch(() => 0)
      ]);

      // 4. Optimized Expense Calculation (Current Period)
      const [yearStr, monthStr] = period.split("-");
      const startDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
      const endDate = new Date(parseInt(yearStr), parseInt(monthStr), 0, 23, 59, 59);

      const expenseAggregate = await prisma.expense.aggregate({
        where: { societyId, paidOn: { gte: startDate, lte: endDate } },
        _sum: { amount: true }
      });
      const totalExpenses = expenseAggregate._sum.amount || 0;

      // 5. Fund Balance Calculation (Aggregation instead of fetching all records)
      const incomeAggregate = await prisma.maintenanceBill.aggregate({
        where: { societyId, status: { in: ["paid", "partial"] } },
        _sum: { paidAmount: true }
      });
      const allExpensesAggregate = await prisma.expense.aggregate({
        where: { societyId },
        _sum: { amount: true }
      });

      const totalIncome = incomeAggregate._sum.paidAmount || 0;
      const totalAllExpenses = allExpensesAggregate._sum.amount || 0;
      const fundBalance = (society?.openingBalance || 0) + totalIncome - totalAllExpenses;

      // 6. Recent Activity (Last 10 bills updated)
      const recentBills = await prisma.maintenanceBill.findMany({
        where: { societyId, period },
        include: { flat: { select: { flatNumber: true, ownerName: true } } },
        orderBy: { updatedAt: "desc" },
        take: 10
      });

      const recentActivity = recentBills.map((b) => ({
        id: b.id,
        flatNumber: b.flat.flatNumber,
        ownerName: b.flat.ownerName,
        amount: b.amount,
        status: b.status,
        paidVia: b.paidVia,
        paidAt: b.paidAt?.toISOString() || null,
        updatedAt: b.updatedAt.toISOString(),
      }));

      // Process bill stats for summary
      let totalCollected = 0;
      let pendingAmount = 0;
      let paidCount = 0;
      let partialCount = 0;
      let pendingCount = 0;

      billStats.forEach(stat => {
        const collected = stat._sum.paidAmount || 0;
        const total = stat._sum.amount || 0;
        
        totalCollected += collected;
        pendingAmount += (total - collected);
        
        if (stat.status === 'paid') paidCount = stat._count.id;
        else if (stat.status === 'partial') partialCount = stat._count.id;
        else if (stat.status === 'pending') pendingCount = stat._count.id;
      });

      return {
        totalCollected,
        pendingAmount,
        totalExpenses,
        totalMembers,
        paidCount,
        partialCount,
        pendingCount,
        totalFlats: society?.totalFlats || totalMembers,
        recentActivity,
        period,
        fundBalance,
        openComplaints,
        visitorsToday: todayVisitors,
        activePolls,
      };
    }, 10_000); // 10s individual cache for dashboard

    return Response.json(data);

  } catch (error: unknown) {
    console.error("Dashboard API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
