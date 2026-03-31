"use client";

import { useEffect, useState } from "react";
import { Download, BarChart3, TrendingUp, PieChart, IndianRupee, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { BarChart, DonutChart, LineChart } from "@/components/ui/Charts";

interface MonthlyReport {
  summary: {
    totalFlats: number;
    billsGenerated: number;
    paid: number;
    pending: number;
    totalCollected: number;
    totalPending: number;
    collectionRate: number;
  };
  paymentMethodBreakdown: Array<{ method: string; count: number; amount: number }>;
  pendingFlats: Array<{ flatNumber: string; ownerName: string; contact: string; amount: number }>;
}

interface AnnualReport {
  year: number;
  months: Array<{ period: string; month: string; generated: number; collected: number; pending: number; rate: number }>;
  totals: { generated: number; collected: number; pending: number; rate: number };
}

const METHOD_COLORS: Record<string, string> = {
  cash: "#22c55e",
  upi: "#3b82f6",
  neft: "#8b5cf6",
  cheque: "#f59e0b",
  unknown: "#6b7280",
};

export default function ReportsPage() {
  const [tab, setTab] = useState<"monthly" | "annual">("monthly");
  const [monthly, setMonthly] = useState<MonthlyReport | null>(null);
  const [annual, setAnnual] = useState<AnnualReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [period] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const periodLabel = (() => {
    const [y, m] = period.split("-").map(Number);
    return new Date(y, m - 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  })();

  useEffect(() => {
    setLoading(true);
    if (tab === "monthly") {
      fetch(`/api/reports/monthly?period=${period}`)
        .then((r) => r.json())
        .then((d) => { setMonthly(d); setLoading(false); })
        .catch(() => setLoading(false));
    } else {
      const year = period.split("-")[0];
      fetch(`/api/reports/annual?year=${year}`)
        .then((r) => r.json())
        .then((d) => { setAnnual(d); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [tab, period]);

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-primary" />
          <div>
            <h1 className="page-title">Financial Reports</h1>
            <p className="text-sm text-text-secondary mt-0.5">
              {tab === "monthly" ? `Monthly Report — ${periodLabel}` : `Annual Summary — ${period.split("-")[0]}`}
            </p>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm">
          <Download className="w-4 h-4" /> Export PDF
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-border rounded-lg p-0.5 mb-6 w-fit">
        {(["monthly", "annual"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setLoading(true); }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === t ? "bg-primary text-white" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {t === "monthly" ? "Monthly" : "Annual"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : tab === "monthly" && monthly ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-card border-l-4 border-l-primary">
              <p className="text-xs text-text-secondary">Total Flats</p>
              <p className="text-2xl font-bold mt-1">{monthly.summary.totalFlats}</p>
              <p className="text-xs text-text-secondary">{monthly.summary.billsGenerated} bills generated</p>
            </div>
            <div className="stat-card border-l-4 border-l-success">
              <p className="text-xs text-text-secondary">Collected</p>
              <p className="text-2xl font-bold mt-1 text-success">{formatCurrency(monthly.summary.totalCollected)}</p>
              <p className="text-xs text-success">{monthly.summary.paid} flats paid</p>
            </div>
            <div className="stat-card border-l-4 border-l-danger">
              <p className="text-xs text-text-secondary">Pending</p>
              <p className="text-2xl font-bold mt-1 text-danger">{formatCurrency(monthly.summary.totalPending)}</p>
              <p className="text-xs text-danger">{monthly.summary.pending} flats pending</p>
            </div>
            <div className="stat-card border-l-4 border-l-warning">
              <p className="text-xs text-text-secondary">Collection Rate</p>
              <p className="text-2xl font-bold mt-1">{monthly.summary.collectionRate}%</p>
              <div className="mt-2 h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${monthly.summary.collectionRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Payment Method + P&L */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Method Chart */}
            {monthly.paymentMethodBreakdown.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-primary" />
                  Payment Methods
                </h3>
                <DonutChart
                  data={monthly.paymentMethodBreakdown.map((m) => ({
                    label: m.method.toUpperCase(),
                    value: m.amount,
                    color: METHOD_COLORS[m.method] || METHOD_COLORS.unknown,
                  }))}
                  centerValue={`${monthly.paymentMethodBreakdown.reduce((s, m) => s + m.count, 0)}`}
                  centerLabel="Payments"
                  size={170}
                />
                <div className="mt-4 space-y-2">
                  {monthly.paymentMethodBreakdown.map((m) => (
                    <div key={m.method} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: METHOD_COLORS[m.method] || METHOD_COLORS.unknown }}
                        />
                        <span className="uppercase font-medium">{m.method}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{formatCurrency(m.amount)}</span>
                        <span className="text-text-secondary ml-2">({m.count} flats)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Income vs Collected Summary */}
            <div className="card">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-primary" />
                Income Summary
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                  <p className="text-xs text-success-text font-medium">Total Collected</p>
                  <p className="text-3xl font-bold text-success-text mt-1">{formatCurrency(monthly.summary.totalCollected)}</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl">
                  <p className="text-xs text-danger-text font-medium">Total Pending</p>
                  <p className="text-3xl font-bold text-danger-text mt-1">{formatCurrency(monthly.summary.totalPending)}</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                  <p className="text-xs text-primary font-medium">Expected Total</p>
                  <p className="text-3xl font-bold text-primary mt-1">
                    {formatCurrency(monthly.summary.totalCollected + monthly.summary.totalPending)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Flats Table */}
          {monthly.pendingFlats.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-danger" />
                Pending Flats ({monthly.pendingFlats.length})
              </h3>
              <div className="table-wrapper !border-0">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Flat</th>
                      <th>Owner</th>
                      <th className="hidden sm:table-cell">Contact</th>
                      <th className="text-right">Amount</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthly.pendingFlats.map((f, i) => (
                      <tr key={i}>
                        <td className="font-medium">{f.flatNumber}</td>
                        <td>{f.ownerName}</td>
                        <td className="hidden sm:table-cell text-text-secondary">{f.contact}</td>
                        <td className="text-right font-medium text-danger">{formatCurrency(f.amount)}</td>
                        <td className="text-right">
                          <button
                            onClick={() => window.open(`https://wa.me/91${f.contact}`, "_blank")}
                            className="btn btn-secondary btn-sm !py-1 !px-2 text-xs"
                          >
                            WhatsApp
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : tab === "annual" && annual ? (
        <div className="space-y-6">
          {/* Annual Chart */}
          <div className="card">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Annual Collection Trend — {annual.year}
            </h3>
            <BarChart
              data={annual.months.filter((m) => m.generated > 0).map((m) => ({
                label: m.month.slice(0, 3),
                value1: m.collected,
                value2: m.pending,
              }))}
              labels={["Collected", "Pending"]}
              colors={["#22c55e", "#ef4444"]}
              height={260}
            />
          </div>

          {/* Annual collection rate trend */}
          <div className="card">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Monthly Collection Rate
            </h3>
            <LineChart
              data={annual.months.filter((m) => m.generated > 0).map((m) => ({
                label: m.month.slice(0, 3),
                value: m.rate,
              }))}
              color="#1e40af"
              height={200}
            />
          </div>

          {/* Annual Table */}
          <div className="card">
            <h3 className="font-semibold text-sm mb-4">Detailed Breakdown</h3>
            <div className="table-wrapper !border-0">
              <table className="table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th className="text-right">Generated</th>
                    <th className="text-right">Collected</th>
                    <th className="text-right">Pending</th>
                    <th className="text-right">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {annual.months.filter((m) => m.generated > 0).map((m) => (
                    <tr key={m.period}>
                      <td className="font-medium">{m.month}</td>
                      <td className="text-right">{formatCurrency(m.generated)}</td>
                      <td className="text-right text-success">{formatCurrency(m.collected)}</td>
                      <td className="text-right text-danger">{formatCurrency(m.pending)}</td>
                      <td className="text-right">
                        <span className={`font-medium ${m.rate >= 80 ? "text-success" : m.rate >= 50 ? "text-warning" : "text-danger"}`}>
                          {m.rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-surface font-semibold">
                    <td>Total</td>
                    <td className="text-right">{formatCurrency(annual.totals.generated)}</td>
                    <td className="text-right text-success">{formatCurrency(annual.totals.collected)}</td>
                    <td className="text-right text-danger">{formatCurrency(annual.totals.pending)}</td>
                    <td className="text-right">{annual.totals.rate}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
