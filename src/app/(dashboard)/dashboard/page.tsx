"use client";

import {
  IndianRupee,
  Clock,
  Users,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  UserCheck,
  Vote,
  Landmark,
  ArrowRight,
  FileText,
  BellRing,
  Zap,
  PieChart,
  BarChart3,
  Timer,
  ShieldAlert,
  RefreshCcw,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";
import { BarChart, DonutChart, LineChart, GaugeChart } from "@/components/ui/Charts";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useLiveData } from "@/lib/use-live-data";
import { useState } from "react";

interface DashboardData {
  totalCollected: number;
  pendingAmount: number;
  totalExpenses: number;
  totalMembers: number;
  paidCount: number;
  partialCount: number;
  pendingCount: number;
  totalFlats: number;
  recentActivity: Array<{
    id: string;
    flatNumber: string;
    ownerName: string;
    amount: number;
    status: string;
    paidVia: string | null;
    paidAt: string | null;
    updatedAt: string;
  }>;
  period: string;
  fundBalance: number;
  openComplaints: number;
  visitorsToday: number;
  activePolls: number;
}

interface AnalyticsData {
  monthlyTrend: Array<{
    period: string;
    label: string;
    collected: number;
    pending: number;
    expenses: number;
    collectionRate: number;
  }>;
  expenseCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
  aging: {
    current: number;
    days30: number;
    days60: number;
    days90Plus: number;
  };
  topDefaulters: Array<{
    flatNumber: string;
    ownerName: string;
    totalDue: number;
    months: number;
  }>;
}

const CATEGORY_COLORS: Record<string, string> = {
  maintenance: "#3b82f6",
  repair: "#f59e0b",
  salary: "#8b5cf6",
  utilities: "#22c55e",
  other: "#6b7280",
};

export default function DashboardPage() {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [applyingLateFees, setApplyingLateFees] = useState(false);

  // Optimized Live Data Loading with Stale-while-revalidate
  const { 
    data: data, 
    loading: dashLoading, 
    refetch: refetchDash,
    isStale: dashStale 
  } = useLiveData<DashboardData>({
    url: "/api/dashboard",
    interval: 60_000, // Refresh every 60s for "live" feel
  });

  const { 
    data: analytics, 
    loading: analyticsLoading, 
    refetch: refetchAnalytics,
    isStale: analyticsStale
  } = useLiveData<AnalyticsData>({
    url: "/api/dashboard/analytics",
    interval: 300_000, // Refresh analytics less frequently (5m)
  });

  const handleGenerateBills = async () => {
    if (!data) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/maintenance/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: data.period }),
      });
      if (res.ok) {
        toast.success("Bills generated successfully");
        refetchDash();
      } else toast.error("Failed to generate bills");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  const handleApplyLateFees = async () => {
    setApplyingLateFees(true);
    try {
      const res = await fetch("/api/maintenance/late-fees", { method: "POST" });
      const result = await res.json();
      if (result.applied > 0) {
        toast.success(`Late fee applied to ${result.applied} overdue bills`);
        refetchDash();
        refetchAnalytics();
      } else {
        toast.success("No overdue bills to apply late fees");
      }
    } catch {
      toast.error("Failed to apply late fees");
    } finally {
      setApplyingLateFees(false);
    }
  };

  if (dashLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="spinner" />
        <p className="text-sm font-medium text-text-secondary animate-pulse">Loading Live Data...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-text-secondary">
        Unable to load dashboard data. <button onClick={() => refetchDash()} className="text-primary hover:underline">Retry</button>
      </div>
    );
  }

  const collectionRate =
    data.totalFlats > 0
      ? Math.round(
          ((data.paidCount + data.partialCount) / data.totalFlats) * 100
        )
      : 0;

  const periodLabel = data.period
    ? new Date(
        parseInt(data.period.split("-")[0]),
        parseInt(data.period.split("-")[1]) - 1
      ).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "Current Month";

  const totalAging = analytics
    ? analytics.aging.current + analytics.aging.days30 + analytics.aging.days60 + analytics.aging.days90Plus
    : 0;

  return (
    <div className={dashStale || analyticsStale ? "opacity-90 grayscale-[0.1] transition-all" : "transition-all"}>
      <div className="page-header relative">
        <div>
          <h1 className="page-title flex items-center gap-2">
            Dashboard
            {(dashStale || analyticsStale) && (
              <RefreshCcw className="w-4 h-4 text-primary animate-spin" />
            )}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Overview for {periodLabel}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {data.totalFlats > 0 &&
        data.paidCount + data.pendingCount + data.partialCount === 0 ? (
          <div className="card bg-primary/5 border-primary/20 flex items-center justify-between p-4">
            <div>
              <h3 className="font-semibold text-sm text-primary">
                Generate Bills
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Create {periodLabel} maintenance bills
              </p>
            </div>
            <button
              onClick={handleGenerateBills}
              disabled={generating}
              className="btn btn-primary btn-sm"
            >
              {generating ? (
                <div className="spinner !w-3 !h-3 !border-white/30 !border-t-white" />
              ) : (
                <>
                  <FileText className="w-3 h-3" /> Generate
                </>
              )}
            </button>
          </div>
        ) : data.pendingCount > 0 ? (
          <div className="card bg-warning-bg/50 border-warning/20 flex items-center justify-between p-4">
            <div>
              <h3 className="font-semibold text-sm text-warning-text">
                Send Reminders
              </h3>
              <p className="text-xs text-warning-text/80 mt-0.5">
                {data.pendingCount} flats have pending dues
              </p>
            </div>
            <button
              onClick={() => router.push("/reminders")}
              className="btn btn-sm !bg-warning text-white hover:!bg-warning/90"
            >
              <BellRing className="w-3 h-3" /> Send
            </button>
          </div>
        ) : null}

        {/* Fund Balance */}
        <div className="card bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 flex items-center justify-between p-4">
          <div>
            <h3 className="font-semibold text-sm text-emerald-700">
              Society Fund Balance
            </h3>
            <p className="text-xl font-bold text-emerald-800 mt-0.5">
              {formatCurrency(data.fundBalance)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Landmark className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        {/* Late Fee Action */}
        {data.pendingCount > 0 && (
          <div className="card bg-red-50/50 border-red-200/50 flex items-center justify-between p-4">
            <div>
              <h3 className="font-semibold text-sm text-red-700">
                Apply Late Fees
              </h3>
              <p className="text-xs text-red-600/80 mt-0.5">
                Charge overdue bills automatically
              </p>
            </div>
            <button
              onClick={handleApplyLateFees}
              disabled={applyingLateFees}
              className="btn btn-sm !bg-red-500 text-white hover:!bg-red-600"
            >
              {applyingLateFees ? (
                <div className="spinner !w-3 !h-3 !border-white/30 !border-t-white" />
              ) : (
                <>
                  <Zap className="w-3 h-3" /> Apply
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-text-secondary">
              Collection
            </span>
            <div className="w-9 h-9 rounded-xl bg-success-bg flex items-center justify-center">
              <IndianRupee className="w-4 h-4 text-success-text" />
            </div>
          </div>
          <p className="text-2xl font-bold text-text-primary">
            {formatCurrency(data.totalCollected)}
          </p>
          <p className="text-xs text-text-secondary mt-1">
            {data.paidCount + data.partialCount} flats paid
          </p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-text-secondary">
              Expenses
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
              <IndianRupee className="w-4 h-4 text-purple-700" />
            </div>
          </div>
          <p className="text-2xl font-bold text-text-primary">
            {formatCurrency(data.totalExpenses)}
          </p>
          <p className="text-xs text-text-secondary mt-1">
            Net:{" "}
            <span
              className={
                data.totalCollected - data.totalExpenses >= 0
                  ? "text-success-text font-semibold"
                  : "text-danger-text font-semibold"
              }
            >
              {formatCurrency(data.totalCollected - data.totalExpenses)}
            </span>
          </p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-text-secondary">
              Pending Dues
            </span>
            <div className="w-9 h-9 rounded-xl bg-danger-bg flex items-center justify-center">
              <Clock className="w-4 h-4 text-danger-text" />
            </div>
          </div>
          <p className="text-2xl font-bold text-text-primary">
            {formatCurrency(data.pendingAmount)}
          </p>
          <p className="text-xs text-text-secondary mt-1">
            {data.pendingCount + data.partialCount} flats pending
          </p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-text-secondary">
              Members
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-700" />
            </div>
          </div>
          <p className="text-2xl font-bold text-text-primary">
            {data.totalMembers}
          </p>
          <p className="text-xs text-text-secondary mt-1">Active flats</p>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Link
          href="/complaints"
          className="stat-card card-hover flex items-center gap-3 !p-3"
        >
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold leading-tight">
              {data.openComplaints}
            </p>
            <p className="text-[11px] text-text-secondary truncate">
              Open Complaints
            </p>
          </div>
        </Link>
        <Link
          href="/visitors"
          className="stat-card card-hover flex items-center gap-3 !p-3"
        >
          <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold leading-tight">
              {data.visitorsToday}
            </p>
            <p className="text-[11px] text-text-secondary truncate">
              Visitors Today
            </p>
          </div>
        </Link>
        <Link
          href="/polls"
          className="stat-card card-hover flex items-center gap-3 !p-3"
        >
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
            <Vote className="w-4 h-4 text-violet-600" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold leading-tight">
              {data.activePolls}
            </p>
            <p className="text-[11px] text-text-secondary truncate">
              Active Polls
            </p>
          </div>
        </Link>
      </div>

      {/* Analytics Charts */}
      {analytics ? (
        <>
          {/* Collection Trend + Gauge */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="card lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">
                  6-Month Collection vs Expenses
                </h3>
              </div>
              <BarChart
                data={analytics.monthlyTrend.map((m) => ({
                  label: m.label,
                  value1: m.collected,
                  value2: m.expenses,
                  value3: m.pending,
                }))}
                labels={["Collected", "Expenses", "Pending"]}
                colors={["#22c55e", "#8b5cf6", "#ef4444"]}
                height={240}
              />
            </div>

            <div className="card flex flex-col items-center justify-center relative">
              {analyticsStale && <div className="absolute top-2 right-2"><RefreshCcw className="w-3 h-3 text-text-secondary animate-spin" /></div>}
              <h3 className="font-semibold text-sm mb-4 self-start flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Collection Rate
              </h3>
              <GaugeChart
                value={collectionRate}
                label={periodLabel}
                size={160}
              />
              <p className="text-xs text-text-secondary mt-2">
                {data.paidCount + data.partialCount} of {data.totalFlats} flats
              </p>
            </div>
          </div>

          {/* Collection Rate Trend + Expense Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">
                  Collection Rate Trend
                </h3>
              </div>
              <LineChart
                data={analytics.monthlyTrend.map((m) => ({
                  label: m.label,
                  value: m.collectionRate,
                }))}
                color="#1e40af"
                height={200}
              />
            </div>

            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">
                  Expense Breakdown ({periodLabel})
                </h3>
              </div>
              {analytics.expenseCategories.length > 0 ? (
                <DonutChart
                  data={analytics.expenseCategories.map((c) => ({
                    label: c.category.charAt(0).toUpperCase() + c.category.slice(1),
                    value: c.amount,
                    color: CATEGORY_COLORS[c.category] || CATEGORY_COLORS.other,
                  }))}
                  centerValue={formatCurrency(
                    analytics.expenseCategories.reduce((s, c) => s + c.amount, 0)
                  )}
                  centerLabel="Total"
                  size={170}
                />
              ) : (
                <p className="text-sm text-text-secondary text-center py-8">
                  No expenses this month
                </p>
              )}
            </div>
          </div>

          {/* Overdue Aging + Top Defaulters */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Timer className="w-4 h-4 text-danger" />
                <h3 className="font-semibold text-sm">Overdue Aging Analysis</h3>
              </div>
              {totalAging > 0 ? (
                <div className="space-y-3">
                  {[
                    { label: "Current (not yet due)", amount: analytics.aging.current, color: "bg-green-500" },
                    { label: "1–30 days overdue", amount: analytics.aging.days30, color: "bg-yellow-500" },
                    { label: "31–60 days overdue", amount: analytics.aging.days60, color: "bg-orange-500" },
                    { label: "90+ days overdue", amount: analytics.aging.days90Plus, color: "bg-red-500" },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-text-secondary">{row.label}</span>
                        <span className="font-medium">{formatCurrency(row.amount)}</span>
                      </div>
                      <div className="h-2 bg-surface rounded-full overflow-hidden">
                        <div
                          className={`h-full ${row.color} rounded-full transition-all duration-500`}
                          style={{
                            width: `${totalAging > 0 ? (row.amount / totalAging) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-border">
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Total Outstanding</span>
                      <span className="text-danger">{formatCurrency(totalAging)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-text-secondary text-center py-8">
                  🎉 No overdue amounts!
                </p>
              )}
            </div>

            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <ShieldAlert className="w-4 h-4 text-danger" />
                <h3 className="font-semibold text-sm">Top Defaulters</h3>
              </div>
              {analytics.topDefaulters.length > 0 ? (
                <div className="space-y-2">
                  {analytics.topDefaulters.slice(0, 6).map((d, i) => (
                    <div
                      key={d.flatNumber}
                      className="flex items-center justify-between py-2 border-b border-border/50 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            i < 3
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{d.ownerName}</p>
                          <p className="text-xs text-text-secondary">
                            Flat {d.flatNumber} · {d.months} month
                            {d.months > 1 ? "s" : ""} due
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-danger">
                        {formatCurrency(d.totalDue)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-secondary text-center py-8">
                  🎉 No defaulters!
                </p>
              )}
            </div>
          </div>
        </>
      ) : analyticsLoading ? (
         <div className="card h-48 flex items-center justify-center mb-6">
            <div className="flex flex-col items-center gap-2">
               <div className="spinner !w-6 !h-6" />
               <p className="text-xs text-text-secondary">Loading Analytics...</p>
            </div>
         </div>
      ) : null}

      {/* Monthly Progress */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm text-text-primary">
              {periodLabel} Collection Progress
            </h3>
          </div>
          <span className="text-sm font-semibold text-primary">
            {collectionRate}%
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${collectionRate}%` }}
          />
        </div>
        <p className="text-xs text-text-secondary mt-2">
          {data.paidCount + data.partialCount} of {data.totalFlats} flats paid (
          {collectionRate}%)
        </p>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm text-text-primary">
              Recent Activity
            </h3>
          </div>
          <Link
            href="/maintenance"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {data.recentActivity.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-6">
            No recent activity
          </p>
        ) : (
          <div className="space-y-3">
            {data.recentActivity.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center">
                    <span className="text-xs font-semibold text-text-secondary">
                      {item.flatNumber}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {item.ownerName}
                    </p>
                    <p className="text-xs text-text-secondary">
                      Flat {item.flatNumber} · {formatCurrency(item.amount)}
                      {item.paidVia
                        ? ` · via ${item.paidVia.toUpperCase()}`
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={item.status} />
                  <span className="text-xs text-text-secondary hidden sm:inline">
                    {new Date(item.updatedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
