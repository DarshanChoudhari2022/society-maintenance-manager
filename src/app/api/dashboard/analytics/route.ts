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

    const cacheKey = `analytics:${societyId}:${getCurrentPeriod()}`;

    const data = await cached(cacheKey, async () => {
      const now = new Date();
      const monthDataPromises = [];

      // Parallelize last 6 months trend calculations
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleDateString("en-IN", { month: "short" });

        const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

        monthDataPromises.push(
          Promise.all([
            // Month Bills Stat
            prisma.maintenanceBill.aggregate({
              where: { societyId, period },
              _sum: { amount: true, paidAmount: true },
              _count: { id: true }
            }),
            // Month Expenses Stat
            prisma.expense.aggregate({
              where: { societyId, paidOn: { gte: monthStart, lte: monthEnd } },
              _sum: { amount: true }
            }),
            // Collection Rate (count paid)
            prisma.maintenanceBill.count({
              where: { societyId, period, status: "paid" }
            }),
            // Result formatting data
            Promise.resolve({ period, label })
          ])
        );
      }

      const results = await Promise.all(monthDataPromises);
      const monthlyTrend = results.map(([billAgg, expenseAgg, paidCount, meta]) => ({
        period: meta.period,
        label: meta.label,
        collected: billAgg._sum.paidAmount || 0,
        pending: (billAgg._sum.amount || 0) - (billAgg._sum.paidAmount || 0),
        expenses: expenseAgg._sum.amount || 0,
        collectionRate: billAgg._count.id > 0
          ? Math.round((paidCount / billAgg._count.id) * 100)
          : 0,
      }));

      // 2. Optimized Category breakdown (Use GroupBy)
      const currentPeriod = getCurrentPeriod();
      const [yearStr, monthStr] = currentPeriod.split("-");
      const startDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
      const endDate = new Date(parseInt(yearStr), parseInt(monthStr), 0, 23, 59, 59);

      const categoryGroup = await prisma.expense.groupBy({
        by: ['category'],
        where: { societyId, paidOn: { gte: startDate, lte: endDate } },
        _sum: { amount: true }
      });

      const totalMonthlyExpenses = categoryGroup.reduce((s, c) => s + (c._sum.amount || 0), 0);
      const expenseCategories = categoryGroup.map(c => ({
        category: c.category,
        amount: c._sum.amount || 0,
        percentage: totalMonthlyExpenses > 0 
          ? Math.round(((c._sum.amount || 0) / totalMonthlyExpenses) * 100) 
          : 0
      }));

      // 3. Optimized Payment Method distribution
      const methodGroup = await prisma.maintenanceBill.groupBy({
        by: ['paidVia'],
        where: { societyId, period: currentPeriod, status: { in: ["paid", "partial"] } },
        _sum: { paidAmount: true },
        _count: { id: true }
      });

      const paymentMethods = methodGroup.map(m => ({
        method: m.paidVia || "unknown",
        count: m._count.id,
        amount: m._sum.paidAmount || 0
      }));

      // 4. Overdue aging analysis (Use Aggregations)
      const agingResults = await prisma.maintenanceBill.findMany({
        where: { societyId, status: { in: ["pending", "partial"] } },
        select: { amount: true, paidAmount: true, dueDate: true }
      });

      const aging = { current: 0, days30: 0, days60: 0, days90Plus: 0 };
      const todayMs = Date.now();
      agingResults.forEach(b => {
        const daysPast = Math.floor((todayMs - new Date(b.dueDate).getTime()) / (1000*60*60*24));
        const rem = b.amount - (b.paidAmount || 0);
        if (daysPast <= 0) aging.current += rem;
        else if (daysPast <= 30) aging.days30 += rem;
        else if (daysPast <= 60) aging.days60 += rem;
        else aging.days90Plus += rem;
      });

      // 5. Top Defaulters (GroupBy with Aggregation)
      const topDefaultersData = await prisma.maintenanceBill.groupBy({
        by: ['flatId'],
        where: { societyId, status: { in: ["pending", "partial"] } },
        _sum: { amount: true, paidAmount: true },
        _count: { id: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 10
      });

      // Enrich top defaulters with names (secondary batch query is faster than a loop)
      const flatIds = topDefaultersData.map(d => d.flatId);
      const flats = await prisma.flat.findMany({
        where: { id: { in: flatIds } },
        select: { id: true, flatNumber: true, ownerName: true }
      });

      const topDefaulters = topDefaultersData.map(d => {
        const flat = flats.find(f => f.id === d.flatId);
        return {
          flatNumber: flat?.flatNumber || "Unknown",
          ownerName: flat?.ownerName || "Unknown",
          totalDue: (d._sum.amount || 0) - (d._sum.paidAmount || 0),
          months: d._count.id
        };
      });

      return {
        monthlyTrend,
        expenseCategories,
        paymentMethods,
        aging,
        topDefaulters,
      };
    }, 15_000); // 15s individual cache for analytics

    return Response.json(data);

  } catch (error: unknown) {
    console.error("Analytics API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
