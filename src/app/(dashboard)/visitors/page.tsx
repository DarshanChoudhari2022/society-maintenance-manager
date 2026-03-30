"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Plus, UserCheck, LogOut as LogOutIcon, Clock, Users } from "lucide-react";

interface Visitor {
  id: string;
  flatNumber: string;
  visitorName: string;
  phone: string | null;
  purpose: string;
  vehicleNo: string | null;
  entryTime: string;
  exitTime: string | null;
  approvedBy: string | null;
  status: string;
  notes: string | null;
}

const purposeColors: Record<string, string> = {
  delivery: "bg-orange-100 text-orange-700",
  guest: "bg-blue-100 text-blue-700",
  service: "bg-purple-100 text-purple-700",
  cab: "bg-green-100 text-green-700",
  other: "bg-gray-100 text-gray-700",
};

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [stats, setStats] = useState({ todayTotal: 0, currentlyIn: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    flatNumber: "",
    visitorName: "",
    phone: "",
    purpose: "guest",
    vehicleNo: "",
    notes: "",
  });

  const fetchVisitors = useCallback(() => {
    setLoading(true);
    fetch("/api/visitors")
      .then((r) => r.json())
      .then((d) => {
        setVisitors(d.visitors || []);
        setStats(d.stats || { todayTotal: 0, currentlyIn: 0 });
      })
      .catch(() => toast.error("Failed to load visitors"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Visitor entry recorded");
        setShowForm(false);
        setForm({ flatNumber: "", visitorName: "", phone: "", purpose: "guest", vehicleNo: "", notes: "" });
        fetchVisitors();
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const markExit = async (id: string) => {
    try {
      const res = await fetch(`/api/visitors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "out" }),
      });
      if (res.ok) {
        toast.success("Visitor exit recorded");
        fetchVisitors();
      }
    } catch {
      toast.error("Failed to update");
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <UserCheck className="w-6 h-6 text-primary" />
          <div>
            <h1 className="page-title">Visitor Management</h1>
            <p className="text-sm text-text-secondary mt-0.5">
              {stats.currentlyIn} currently inside · {stats.todayTotal} today
            </p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm">
          <Plus className="w-4 h-4" /> Log Visitor
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="stat-card border-l-4 border-l-success">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-success" />
            <p className="text-xs text-text-secondary">Currently Inside</p>
          </div>
          <p className="text-2xl font-bold">{stats.currentlyIn}</p>
        </div>
        <div className="stat-card border-l-4 border-l-primary">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-primary" />
            <p className="text-xs text-text-secondary">Today&apos;s Visitors</p>
          </div>
          <p className="text-2xl font-bold">{stats.todayTotal}</p>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : visitors.length === 0 ? (
        <div className="card text-center py-12 text-text-secondary">No visitor entries yet.</div>
      ) : (
        <div className="space-y-3">
          {visitors.map((v) => (
            <div key={v.id} className={`card card-hover ${v.status === "in" ? "border-l-4 border-l-success" : ""}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{v.visitorName}</h3>
                    <span className={`badge text-[10px] ${purposeColors[v.purpose] || purposeColors.other}`}>
                      {v.purpose}
                    </span>
                    <span className={`badge text-[10px] ${v.status === "in" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {v.status === "in" ? "Inside" : "Exited"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-text-secondary">
                    <span>Flat: <strong>{v.flatNumber}</strong></span>
                    {v.phone && <span>📞 {v.phone}</span>}
                    {v.vehicleNo && <span>🚗 {v.vehicleNo}</span>}
                    <span>In: {formatTime(v.entryTime)}</span>
                    {v.exitTime && <span>Out: {formatTime(v.exitTime)}</span>}
                  </div>
                </div>
                {v.status === "in" && (
                  <button onClick={() => markExit(v.id)} className="btn btn-secondary btn-sm !py-1 !px-3 text-xs">
                    <LogOutIcon className="w-3 h-3" /> Mark Exit
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Visitor Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content !max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Log Visitor Entry</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Visitor Name *</label><input className="input" placeholder="Name" value={form.visitorName} onChange={(e) => setForm({ ...form, visitorName: e.target.value })} required /></div>
                <div><label className="label">Flat Number *</label><input className="input" placeholder="e.g. A-101" value={form.flatNumber} onChange={(e) => setForm({ ...form, flatNumber: e.target.value })} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Phone</label><input className="input" placeholder="Mobile" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div>
                  <label className="label">Purpose *</label>
                  <select className="select" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}>
                    <option value="guest">Guest</option>
                    <option value="delivery">Delivery</option>
                    <option value="service">Service</option>
                    <option value="cab">Cab</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Vehicle No.</label><input className="input" placeholder="MH12AB1234" value={form.vehicleNo} onChange={(e) => setForm({ ...form, vehicleNo: e.target.value })} /></div>
                <div><label className="label">Notes</label><input className="input" placeholder="Optional" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? <div className="spinner !w-4 !h-4 !border-white/30 !border-t-white" /> : "Log Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
