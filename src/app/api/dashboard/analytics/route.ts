import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentPeriod } from "@/lib/utils";

export async function GET() {
  try {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  // Get last 6 months of collection data for trend chart
  const months: Array<{
    period: string;
    label: string;
    collected: number;
    pending: number;
    expenses: number;
    collectionRate: number;
  }> = [];

  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-IN", { month: "short" });

    const bills = await prisma.maintenanceBill.findMany({
      where: { societyId, period },
    });

    const paid = bills.filter((b) => b.status === "paid" || b.status === "partial");
    const collected = paid.reduce((s, b) => s + (b.paidAmount || b.amount), 0);
    const totalBilled = bills.reduce((s, b) => s + b.amount, 0);
    const pending = totalBilled - collected;

    // Expenses for this month
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const expensesData = await prisma.expense.findMany({
      where: {
        societyId,
        paidOn: { gte: monthStart, lte: monthEnd },
      },
    });
    const expenseTotal = expensesData.reduce((s, e) => s + e.amount, 0);

    months.push({
      period,
      label,
      collected,
      pending: Math.max(0, pending),
      expenses: expenseTotal,
      collectionRate: bills.length > 0
        ? Math.round((paid.length / bills.length) * 100)
        : 0,
    });
  }

  // Expense category breakdown (current month)
  const currentPeriod = getCurrentPeriod();
  const [yearStr, monthStr] = currentPeriod.split("-");
  const startDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
  const endDate = new Date(parseInt(yearStr), parseInt(monthStr), 0, 23, 59, 59);
  
  const currentExpenses = await prisma.expense.findMany({
    where: {
      societyId,
      paidOn: { gte: startDate, lte: endDate },
    },
  });

  const categoryMap: Record<string, number> = {};
  currentExpenses.forEach((e) => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
  });

  const expenseCategories = Object.entries(categoryMap).map(([category, amount]) => ({
    category,
    amount,
    percentage: currentExpenses.length > 0
      ? Math.round(
          (amount / currentExpenses.reduce((s, e) => s + e.amount, 0)) * 100
        )
      : 0,
  }));

  // Payment method distribution (current month)
  const currentBills = await prisma.maintenanceBill.findMany({
    where: { societyId, period: currentPeriod, status: { in: ["paid", "partial"] } },
  });

  const methodMap: Record<string, { count: number; amount: number }> = {};
  currentBills.forEach((b) => {
    const method = b.paidVia || "unknown";
    if (!methodMap[method]) methodMap[method] = { count: 0, amount: 0 };
    methodMap[method].count++;
    methodMap[method].amount += b.paidAmount || b.amount;
  });

  const paymentMethods = Object.entries(methodMap).map(([method, data]) => ({
    method,
    ...data,
  }));

  // Overdue aging analysis
  const allPendingBills = await prisma.maintenanceBill.findMany({
    where: { societyId, status: { in: ["pending", "partial"] } },
    include: { flat: true },
  });

  const aging = { current: 0, days30: 0, days60: 0, days90Plus: 0 };
  const todayMs = Date.now();

  allPendingBills.forEach((b) => {
    const dueMs = new Date(b.dueDate).getTime();
    const daysPast = Math.floor((todayMs - dueMs) / (1000 * 60 * 60 * 24));
    const remaining = b.amount - (b.paidAmount || 0);

    if (daysPast <= 0) aging.current += remaining;
    else if (daysPast <= 30) aging.days30 += remaining;
    else if (daysPast <= 60) aging.days60 += remaining;
    else aging.days90Plus += remaining;
  });

  // Top defaulters
  const defaulterMap: Record<string, { flatNumber: string; ownerName: string; totalDue: number; months: number }> = {};
  allPendingBills.forEach((b) => {
    const key = b.flatId;
    if (!defaulterMap[key]) {
      defaulterMap[key] = {
        flatNumber: b.flat.flatNumber,
        ownerName: b.flat.ownerName,
        totalDue: 0,
        months: 0,
      };
    }
    defaulterMap[key].totalDue += b.amount - (b.paidAmount || 0);
    defaulterMap[key].months++;
  });

  const topDefaulters = Object.values(defaulterMap)
    .sort((a, b) => b.totalDue - a.totalDue)
    .slice(0, 10);

  return Response.json({
    monthlyTrend: months,
    expenseCategories,
    paymentMethods,
    aging,
    topDefaulters,
  });
  } catch (error: unknown) {
    console.error("Analytics API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
