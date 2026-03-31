"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Plus, Wallet, Download, RefreshCcw } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ExpenseType } from "@/types";
import { useLiveData } from "@/lib/use-live-data";

export default function ExpensesPage() {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "maintenance",
    paidTo: "",
    paidOn: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Optimized Live Data Loading
  const { 
    data, 
    loading, 
    refetch,
    isStale 
  } = useLiveData<{ expenses: ExpenseType[], total: number }>({
    url: "/api/expenses",
    interval: 60_000, // Refresh every minute
  });

  const expenses = data?.expenses || [];
  const total = data?.total || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Expense added");
        setShowForm(false);
        setForm({ title: "", amount: "", category: "maintenance", paidTo: "", paidOn: new Date().toISOString().split("T")[0], notes: "" });
        refetch();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to add expense");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const categoryColors: Record<string, string> = {
    maintenance: "bg-blue-100 text-blue-700",
    repair: "bg-orange-100 text-orange-700",
    salary: "bg-purple-100 text-purple-700",
    utilities: "bg-green-100 text-green-700",
    other: "bg-gray-100 text-gray-700",
  };

  const exportCsv = async () => {
    try {
      const headers = ["Description", "Amount", "Category", "Paid To", "Paid On", "Notes"];
      const csvContent = [
        headers.join(","),
        ...expenses.map((e: any) => 
          [e.title, e.amount, e.category, e.paidTo || "", new Date(e.paidOn).toISOString().split('T')[0], e.notes || ""].map(v => `"${v}"`).join(",")
        )
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `expenses_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      toast.success("Export successful");
    } catch { toast.error("Failed to export"); }
  };

  return (
    <div className={isStale ? "opacity-90 transition-opacity" : "transition-opacity"}>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Wallet className="w-6 h-6 text-primary" />
          <div>
            <h1 className="page-title flex items-center gap-2">
               Expenses
               {loading && !data && <div className="spinner !w-4 !h-4" />}
               {isStale && <RefreshCcw className="w-4 h-4 text-primary animate-spin" />}
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">
              Total: {formatCurrency(total)} this month
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={exportCsv} className="btn btn-secondary btn-sm"><Download className="w-4 h-4" /> Export CSV</button>
          <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm"><Plus className="w-4 h-4" /> Add Expense</button>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content !max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Add Expense</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><label className="label">Description *</label><input className="input" placeholder="e.g. Lift AMC" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="label">Amount *</label><input type="number" className="input" placeholder="₹" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
                <div><label className="label">Category *</label><select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="maintenance">Maintenance</option><option value="repair">Repair</option><option value="salary">Salary</option><option value="utilities">Utilities</option><option value="other">Other</option></select></div>
              </div>
              <div><label className="label">Date *</label><input type="date" className="input" value={form.paidOn} onChange={(e) => setForm({ ...form, paidOn: e.target.value })} required /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? <div className="spinner !w-4 !h-4 !border-white/30 !border-t-white" /> : "Add Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && !data ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : expenses.length === 0 ? (
        <div className="card text-center py-12 text-text-secondary">No records found.</div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td className="text-text-secondary">{formatDate(e.paidOn)}</td>
                  <td className="font-medium">{e.title}</td>
                  <td><span className={`badge text-xs ${categoryColors[e.category] || categoryColors.other}`}>{e.category}</span></td>
                  <td className="text-right font-medium">{formatCurrency(e.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
