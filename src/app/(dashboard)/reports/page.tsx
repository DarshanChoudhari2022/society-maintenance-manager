"use client";

import { useEffect, useState } from "react";
import { Download, BarChart3 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

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
            <h1 className="page-title">Reports</h1>
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
            onClick={() => setTab(t)}
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
          {/* Summary */}
          <div className="card">
            <h3 className="font-semibold text-sm mb-4">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Flats", value: monthly.summary.totalFlats },
                { label: "Bills Generated", value: monthly.summary.billsGenerated },
                { label: "Paid", value: `${monthly.summary.paid} (${monthly.summary.collectionRate}%)` },
                { label: "Pending", value: monthly.summary.pending },
              ].map((item) => (
                <div key={item.label} className="p-3 bg-surface rounded-lg">
                  <p className="text-xs text-text-secondary">{item.label}</p>
                  <p className="text-lg font-bold mt-1">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="p-3 bg-success-bg rounded-lg">
                <p className="text-xs text-success-text">Total Collected</p>
                <p className="text-xl font-bold text-success-text mt-1">{formatCurrency(monthly.summary.totalCollected)}</p>
              </div>
              <div className="p-3 bg-danger-bg rounded-lg">
                <p className="text-xs text-danger-text">Total Pending</p>
                <p className="text-xl font-bold text-danger-text mt-1">{formatCurrency(monthly.summary.totalPending)}</p>
              </div>
            </div>
          </div>

          {/* Payment Method Breakdown */}
          {monthly.paymentMethodBreakdown.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-sm mb-4">Payment Method Breakdown</h3>
              <div className="table-wrapper !border-0">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Method</th>
                      <th>Flats</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthly.paymentMethodBreakdown.map((m) => (
                      <tr key={m.method}>
                        <td className="font-medium uppercase">{m.method}</td>
                        <td>{m.count} flats</td>
                        <td className="text-right font-medium">{formatCurrency(m.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pending Flats */}
          {monthly.pendingFlats.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-sm mb-4">Pending Flats ({monthly.pendingFlats.length})</h3>
              <div className="table-wrapper !border-0">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Flat</th>
                      <th>Owner</th>
                      <th className="hidden sm:table-cell">Contact</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthly.pendingFlats.map((f, i) => (
                      <tr key={i}>
                        <td className="font-medium">{f.flatNumber}</td>
                        <td>{f.ownerName}</td>
                        <td className="hidden sm:table-cell text-text-secondary">{f.contact}</td>
                        <td className="text-right font-medium">{formatCurrency(f.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : tab === "annual" && annual ? (
        <div className="card">
          <h3 className="font-semibold text-sm mb-4">Annual Summary — {annual.year}</h3>
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
                    <td className="text-right font-medium">{m.rate}%</td>
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
      ) : null}
    </div>
  );
}
