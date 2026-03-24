"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Wallet } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ExpenseType } from "@/types";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseType[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
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

  const fetchExpenses = () => {
    setLoading(true);
    fetch("/api/expenses")
      .then((r) => r.json())
      .then((d) => {
        setExpenses(d.expenses || []);
        setTotal(d.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(fetchExpenses, []);

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
        fetchExpenses();
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

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Wallet className="w-6 h-6 text-primary" />
          <div>
            <h1 className="page-title">Expenses</h1>
            <p className="text-sm text-text-secondary mt-0.5">
              Total: {formatCurrency(total)} this month
            </p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm">
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* Add Expense Modal */}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="label">Paid To</label><input className="input" placeholder="Vendor name" value={form.paidTo} onChange={(e) => setForm({ ...form, paidTo: e.target.value })} /></div>
                <div><label className="label">Date *</label><input type="date" className="input" value={form.paidOn} onChange={(e) => setForm({ ...form, paidOn: e.target.value })} required /></div>
              </div>
              <div><label className="label">Notes</label><textarea className="input !h-auto" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
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

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : expenses.length === 0 ? (
        <div className="card text-center py-12 text-text-secondary">No expenses recorded yet.</div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th className="text-right">Amount</th>
                <th className="hidden sm:table-cell">Paid To</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td className="text-text-secondary">{formatDate(e.paidOn)}</td>
                  <td className="font-medium">{e.title}</td>
                  <td>
                    <span className={`badge text-xs ${categoryColors[e.category] || categoryColors.other}`}>
                      {e.category}
                    </span>
                  </td>
                  <td className="text-right font-medium">{formatCurrency(e.amount)}</td>
                  <td className="hidden sm:table-cell text-text-secondary">{e.paidTo || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
