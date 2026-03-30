"use client";

import { useEffect, useState } from "react";
import { IndianRupee, Clock, Users, TrendingUp, CreditCard, AlertTriangle, UserCheck, Vote, Landmark } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";
import Link from "next/link";

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

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowRight, FileText, BellRing } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
        router.refresh();
        window.location.reload();
      } else {
        toast.error("Failed to generate bills");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-text-secondary">
        Unable to load dashboard data.
      </div>
    );
  }

  const collectionRate =
    data.totalFlats > 0
      ? Math.round(((data.paidCount + data.partialCount) / data.totalFlats) * 100)
      : 0;

  const periodLabel = data.period
    ? new Date(
        parseInt(data.period.split("-")[0]),
        parseInt(data.period.split("-")[1]) - 1
      ).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "Current Month";

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-text-secondary mt-1">
            Overview for {periodLabel}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {data.totalFlats > 0 && (data.paidCount + data.pendingCount + data.partialCount) === 0 ? (
          <div className="card bg-primary/5 border-primary/20 flex items-center justify-between p-4">
            <div>
              <h3 className="font-semibold text-sm text-primary">Generate Bills</h3>
              <p className="text-xs text-text-secondary mt-0.5">Create {periodLabel} maintenance bills</p>
            </div>
            <button onClick={handleGenerateBills} disabled={generating} className="btn btn-primary btn-sm">
              {generating ? <div className="spinner !w-3 !h-3 !border-white/30 !border-t-white" /> : <><FileText className="w-3 h-3" /> Generate</>}
            </button>
          </div>
        ) : data.pendingCount > 0 ? (
          <div className="card bg-warning-bg/50 border-warning/20 flex items-center justify-between p-4">
            <div>
              <h3 className="font-semibold text-sm text-warning-text">Send Reminders</h3>
              <p className="text-xs text-warning-text/80 mt-0.5">{data.pendingCount} flats have pending dues</p>
            </div>
            <button onClick={() => router.push("/reminders")} className="btn btn-sm !bg-warning text-white hover:!bg-warning/90">
              <BellRing className="w-3 h-3" /> Send
            </button>
          </div>
        ) : null}

        {/* Fund Balance Card */}
        <div className="card bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 flex items-center justify-between p-4">
          <div>
            <h3 className="font-semibold text-sm text-emerald-700">Society Fund Balance</h3>
            <p className="text-xl font-bold text-emerald-800 mt-0.5">{formatCurrency(data.fundBalance)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Landmark className="w-5 h-5 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Collection */}
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

        {/* Expenses */}
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
            Net: <span className={data.totalCollected - data.totalExpenses >= 0 ? "text-success-text font-semibold" : "text-danger-text font-semibold"}>
              {formatCurrency(data.totalCollected - data.totalExpenses)}
            </span>
          </p>
        </div>

        {/* Pending Amount */}
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

        {/* Members */}
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
        <Link href="/complaints" className="stat-card card-hover flex items-center gap-3 !p-3">
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold leading-tight">{data.openComplaints}</p>
            <p className="text-[11px] text-text-secondary truncate">Open Complaints</p>
          </div>
        </Link>
        <Link href="/visitors" className="stat-card card-hover flex items-center gap-3 !p-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold leading-tight">{data.visitorsToday}</p>
            <p className="text-[11px] text-text-secondary truncate">Visitors Today</p>
          </div>
        </Link>
        <Link href="/polls" className="stat-card card-hover flex items-center gap-3 !p-3">
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
            <Vote className="w-4 h-4 text-violet-600" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold leading-tight">{data.activePolls}</p>
            <p className="text-[11px] text-text-secondary truncate">Active Polls</p>
          </div>
        </Link>
      </div>

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
          {data.paidCount + data.partialCount} of {data.totalFlats} flats paid ({collectionRate}%)
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
          <Link href="/maintenance" className="text-xs text-primary hover:underline flex items-center gap-1">
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
                      Flat {item.flatNumber} ·{" "}
                      {formatCurrency(item.amount)}
                      {item.paidVia ? ` · via ${item.paidVia.toUpperCase()}` : ""}
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
