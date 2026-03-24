"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, Search, FileText, Bell, Zap } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import type { BillWithFlat, BillingSummary } from "@/types";
import Link from "next/link";

export default function MaintenancePage() {
  const [bills, setBills] = useState<BillWithFlat[]>([]);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [generating, setGenerating] = useState(false);
  const [markPaidBill, setMarkPaidBill] = useState<BillWithFlat | null>(null);
  const [payForm, setPayForm] = useState({
    paidAmount: "",
    paidVia: "cash",
    paidAt: new Date().toISOString().split("T")[0],
    receiptNote: "",
  });

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period, status: statusFilter });
      if (search) params.set("search", search);
      const res = await fetch(`/api/maintenance/bills?${params}`);
      const data = await res.json();
      setBills(data.bills || []);
      setSummary(data.summary || null);
    } catch {
      toast.error("Failed to load bills");
    } finally {
      setLoading(false);
    }
  }, [period, statusFilter, search]);

  useEffect(() => {
    const timer = setTimeout(fetchBills, 300);
    return () => clearTimeout(timer);
  }, [fetchBills]);

  const navigateMonth = (dir: number) => {
    const [y, m] = period.split("-").map(Number);
    const date = new Date(y, m - 1 + dir);
    setPeriod(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  };

  const periodLabel = (() => {
    const [y, m] = period.split("-").map(Number);
    return new Date(y, m - 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  })();

  const generateBills = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/maintenance/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${data.generated} bills generated for ${periodLabel}`);
        fetchBills();
      } else {
        toast.error(data.error || "Failed to generate bills");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!markPaidBill) return;
    try {
      const res = await fetch(`/api/maintenance/bills/${markPaidBill.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "paid",
          paidAmount: parseFloat(payForm.paidAmount) || markPaidBill.amount,
          paidVia: payForm.paidVia,
          paidAt: payForm.paidAt,
          receiptNote: payForm.receiptNote,
        }),
      });
      if (res.ok) {
        toast.success(`Flat ${markPaidBill.flat.flatNumber} marked as paid`);
        fetchBills();
      } else {
        toast.error("Failed to update");
      }
    } catch {
      toast.error("Something went wrong");
    }
    setMarkPaidBill(null);
  };

  const openMarkPaid = (bill: BillWithFlat) => {
    setMarkPaidBill(bill);
    setPayForm({
      paidAmount: bill.amount.toString(),
      paidVia: "cash",
      paidAt: new Date().toISOString().split("T")[0],
      receiptNote: "",
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="page-title">Maintenance</h1>
          <div className="flex items-center gap-1 bg-white border border-border rounded-lg px-1">
            <button onClick={() => navigateMonth(-1)} className="p-1.5 hover:bg-surface rounded">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium px-2 min-w-[140px] text-center">{periodLabel}</span>
            <button onClick={() => navigateMonth(1)} className="p-1.5 hover:bg-surface rounded">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="stat-card border-l-4 border-l-success">
            <p className="text-sm font-medium text-text-secondary">Paid</p>
            <p className="text-xl font-bold text-text-primary mt-1">{summary.paid} flats</p>
            <p className="text-sm text-success font-medium">{formatCurrency(summary.collectedAmount)}</p>
          </div>
          <div className="stat-card border-l-4 border-l-danger">
            <p className="text-sm font-medium text-text-secondary">Pending</p>
            <p className="text-xl font-bold text-text-primary mt-1">{summary.pending} flats</p>
            <p className="text-sm text-danger font-medium">{formatCurrency(summary.pendingAmount)}</p>
          </div>
          <div className="stat-card border-l-4 border-l-primary">
            <p className="text-sm font-medium text-text-secondary">Total</p>
            <p className="text-xl font-bold text-text-primary mt-1">{summary.total} flats</p>
            <p className="text-sm text-primary font-medium">{formatCurrency(summary.collectedAmount + summary.pendingAmount)}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {summary && summary.total === 0 && (
          <button onClick={generateBills} disabled={generating} className="btn btn-primary btn-sm">
            {generating ? <div className="spinner !w-4 !h-4 !border-white/30 !border-t-white" /> : <><Zap className="w-4 h-4" /> Generate bills for {periodLabel}</>}
          </button>
        )}
        {summary && summary.pending > 0 && (
          <Link href="/reminders" className="btn btn-secondary btn-sm">
            <Bell className="w-4 h-4" />
            Send reminders to {summary.pending} pending
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Search flat number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 bg-white border border-border rounded-lg p-0.5">
          {["all", "paid", "pending"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                statusFilter === s ? "bg-primary text-white" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : bills.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <h3>No bills found</h3>
            <p>Generate bills for {periodLabel} to get started.</p>
            <button onClick={generateBills} disabled={generating} className="btn btn-primary">
              <Zap className="w-4 h-4" /> Generate Bills
            </button>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Flat No.</th>
                <th>Owner Name</th>
                <th>Amount</th>
                <th>Status</th>
                <th className="hidden sm:table-cell">Due Date</th>
                <th className="hidden md:table-cell">Paid Via</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill.id}>
                  <td className="font-medium">{bill.flat.flatNumber}</td>
                  <td>{bill.flat.ownerName}</td>
                  <td className="font-medium">{formatCurrency(bill.amount)}</td>
                  <td><StatusBadge status={bill.status} /></td>
                  <td className="hidden sm:table-cell text-text-secondary">
                    {new Date(bill.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </td>
                  <td className="hidden md:table-cell text-text-secondary">
                    {bill.paidVia ? bill.paidVia.toUpperCase() : "—"}
                  </td>
                  <td>
                    <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
                      {bill.status === "paid" ? (
                        <Link href={`/receipts/${bill.id}`} className="btn btn-secondary btn-sm !py-1 !px-2 text-xs">
                          <FileText className="w-3 h-3" /> Receipt
                        </Link>
                      ) : (
                        <>
                          <button onClick={() => openMarkPaid(bill)} className="btn btn-success btn-sm !py-1 !px-2 text-xs">
                            Mark Paid
                          </button>
                          <button
                            onClick={() => window.open(`https://wa.me/91${bill.flat.contact}`, "_blank")}
                            className="btn btn-secondary btn-sm !py-1 !px-2 text-xs"
                          >
                            WA
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mark Paid Modal */}
      {markPaidBill && (
        <div className="modal-overlay" onClick={() => setMarkPaidBill(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">
              Mark Flat {markPaidBill.flat.flatNumber} as Paid
            </h3>
            <div className="space-y-3">
              <div>
                <label className="label">Amount Collected *</label>
                <input
                  type="number"
                  className="input"
                  value={payForm.paidAmount}
                  onChange={(e) => setPayForm({ ...payForm, paidAmount: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Payment Method *</label>
                <select
                  className="select"
                  value={payForm.paidVia}
                  onChange={(e) => setPayForm({ ...payForm, paidVia: e.target.value })}
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="neft">NEFT</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="label">Payment Date *</label>
                <input
                  type="date"
                  className="input"
                  value={payForm.paidAt}
                  onChange={(e) => setPayForm({ ...payForm, paidAt: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Receipt Note</label>
                <input
                  className="input"
                  placeholder="Optional"
                  value={payForm.receiptNote}
                  onChange={(e) => setPayForm({ ...payForm, receiptNote: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setMarkPaidBill(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleMarkPaid} className="btn btn-primary">Confirm Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
