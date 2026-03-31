"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, Search, FileText, Bell, Zap, RefreshCcw } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import type { BillWithFlat, BillingSummary } from "@/types";
import Link from "next/link";
import { useLiveQuery } from "@/lib/use-live-data";

export default function MaintenancePage() {
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

  // Optimized query hook with live polling
  const { 
    data, 
    loading, 
    refetch,
    isStale 
  } = useLiveQuery<{ bills: BillWithFlat[], summary: BillingSummary }>(
    "/api/maintenance/bills",
    { period, status: statusFilter, search },
    { interval: 30_000 } // Refresh list every 30s
  );

  const bills = data?.bills || [];
  const summary = data?.summary || null;

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
        refetch();
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
    const paidAmount = parseFloat(payForm.paidAmount) || 0;
    const isPartial = paidAmount < markPaidBill.amount;
    const remaining = markPaidBill.amount - paidAmount;
    
    let note = payForm.receiptNote;
    if (isPartial && remaining > 0) {
      const remainingText = `₹${remaining} remaining`;
      if (!note.includes(remainingText)) {
        note = note ? `${note} (${remainingText})` : remainingText;
      }
    }

    try {
      const res = await fetch(`/api/maintenance/bills/${markPaidBill.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: isPartial ? "partial" : "paid",
          paidAmount: paidAmount,
          paidVia: payForm.paidVia,
          paidAt: payForm.paidAt,
          receiptNote: note,
        }),
      });
      if (res.ok) {
        toast.success(`Flat ${markPaidBill.flat.flatNumber} updated`);
        refetch();
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
    const remaining = bill.status === "partial" && bill.paidAmount ? bill.amount - bill.paidAmount : bill.amount;
    setPayForm({
      paidAmount: remaining.toString(),
      paidVia: bill.paidVia || "cash",
      paidAt: new Date().toISOString().split("T")[0],
      receiptNote: "",
    });
  };

  const exportCsv = async () => {
    try {
      const res = await fetch(`/api/maintenance/bills?period=${period}`);
      const data = await res.json();
      if (!data.bills || data.bills.length === 0) return toast.error("No bills to export");
      
      const headers = ["Flat No.", "Owner Name", "Amount", "Paid Amount", "Status", "Due Date", "Paid Date", "Payment Method", "Receipt No", "Note"];
      const csvContent = [headers.join(","), ...data.bills.map((b: any) => [b.flat.flatNumber, b.flat.ownerName, b.amount, b.paidAmount || 0, b.status, new Date(b.dueDate).toISOString().split('T')[0], b.paidAt ? new Date(b.paidAt).toISOString().split('T')[0] : "", b.paidVia || "", b.receiptNumber || "", b.receiptNote || ""].map(v => `"${v}"`).join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `maintenance_bills_${period}.csv`);
      link.click();
      toast.success("Export successful");
    } catch { toast.error("Failed to export"); }
  };

  return (
    <div className={isStale ? "opacity-90" : "transition-opacity"}>
      {/* Header */}
      <div className="page-header">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="page-title flex items-center gap-2">
            Maintenance
            {loading && !data && <div className="spinner !w-4 !h-4" />}
            {isStale && <RefreshCcw className="w-4 h-4 text-primary animate-spin" />}
          </h1>
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
            <p className="text-sm font-medium text-text-secondary">Paid ({summary.paid})</p>
            <p className="text-xl font-bold text-success-text mt-1">{formatCurrency(summary.collectedAmount)}</p>
          </div>
          <div className="stat-card border-l-4 border-l-danger">
            <p className="text-sm font-medium text-text-secondary">Pending ({summary.pending})</p>
            <p className="text-xl font-bold text-danger-text mt-1">{formatCurrency(summary.pendingAmount)}</p>
          </div>
          <div className="stat-card border-l-4 border-l-primary">
            <p className="text-sm font-medium text-text-secondary">Total Billed</p>
            <p className="text-xl font-bold text-primary mt-1">{formatCurrency(summary.collectedAmount + summary.pendingAmount)}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={exportCsv} className="btn btn-secondary btn-sm"><FileText className="w-4 h-4" /> Export CSV</button>
        {summary && summary.total === 0 && (
          <button onClick={generateBills} disabled={generating} className="btn btn-primary btn-sm">
            {generating ? <div className="spinner !w-4 !h-4 !border-white/30 !border-t-white" /> : <><Zap className="w-4 h-4" /> Generate bills for {periodLabel}</>}
          </button>
        )}
        {summary && summary.pending > 0 && (
          <Link href="/reminders" className="btn btn-secondary btn-sm"><Bell className="w-4 h-4" /> Send reminders</Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input type="text" className="input pl-9" placeholder="Search flat or owner..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 bg-white border border-border rounded-lg p-0.5">
          {["all", "paid", "partial", "pending"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${statusFilter === s ? "bg-primary text-white" : "text-text-secondary hover:text-text-primary"}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : bills.length === 0 ? (
        <div className="card text-center py-12 text-text-secondary">No records found.</div>
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
                  <td className="hidden sm:table-cell text-text-secondary">{new Date(bill.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      {bill.status === "paid" ? (
                        <Link href={`/receipts/${bill.id}`} className="btn btn-secondary btn-sm !py-1 !px-2 text-xs">Receipt</Link>
                      ) : (
                        <button onClick={() => openMarkPaid(bill)} className="btn btn-primary btn-sm !py-1 !px-2 text-xs">Collect</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {markPaidBill && (
        <div className="modal-overlay" onClick={() => setMarkPaidBill(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Payment: Flat {markPaidBill.flat.flatNumber}</h3>
            <div className="space-y-3">
              <div><label className="label">Amount Collected (Total: {formatCurrency(markPaidBill.amount)})</label>
                <input type="number" className="input" value={payForm.paidAmount} onChange={(e) => setPayForm({ ...payForm, paidAmount: e.target.value })} /></div>
              <div><label className="label">Via</label><select className="select" value={payForm.paidVia} onChange={(e) => setPayForm({ ...payForm, paidVia: e.target.value })}><option value="cash">Cash</option><option value="upi">UPI</option><option value="neft">NEFT</option></select></div>
              <div><label className="label">Receipt Note</label><input className="input" placeholder="Ref/Chq No" value={payForm.receiptNote} onChange={(e) => setPayForm({ ...payForm, receiptNote: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6"><button onClick={() => setMarkPaidBill(null)} className="btn btn-secondary">Cancel</button><button onClick={handleMarkPaid} className="btn btn-primary">Save</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
