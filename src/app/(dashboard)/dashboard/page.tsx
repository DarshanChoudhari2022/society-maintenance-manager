"use client";

import { useEffect, useState } from "react";
import { IndianRupee, Clock, Users, TrendingUp, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";

interface DashboardData {
  totalCollected: number;
  pendingAmount: number;
  totalMembers: number;
  paidCount: number;
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
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
      ? Math.round((data.paidCount / data.totalFlats) * 100)
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Total Collection */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-text-secondary">
              Total Collection
            </span>
            <div className="w-9 h-9 rounded-xl bg-success-bg flex items-center justify-center">
              <IndianRupee className="w-4 h-4 text-success-text" />
            </div>
          </div>
          <p className="text-2xl font-bold text-text-primary">
            {formatCurrency(data.totalCollected)}
          </p>
          <p className="text-xs text-text-secondary mt-1">
            {data.paidCount} flats paid this month
          </p>
        </div>

        {/* Pending Amount */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-text-secondary">
              Pending Amount
            </span>
            <div className="w-9 h-9 rounded-xl bg-danger-bg flex items-center justify-center">
              <Clock className="w-4 h-4 text-danger-text" />
            </div>
          </div>
          <p className="text-2xl font-bold text-text-primary">
            {formatCurrency(data.pendingAmount)}
          </p>
          <p className="text-xs text-text-secondary mt-1">
            {data.pendingCount} flats pending
          </p>
        </div>

        {/* Members */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-text-secondary">
              Members
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#ede9fe] flex items-center justify-center">
              <Users className="w-4 h-4 text-[#6d28d9]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-text-primary">
            {data.totalMembers}
          </p>
          <p className="text-xs text-text-secondary mt-1">Active flats</p>
        </div>
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
          {data.paidCount} of {data.totalFlats} flats paid ({collectionRate}%)
        </p>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm text-text-primary">
            Recent Activity
          </h3>
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
