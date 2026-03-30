"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Plus, AlertTriangle, CheckCircle2, Clock, Filter } from "lucide-react";

interface Complaint {
  id: string;
  flatNumber: string;
  raisedBy: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

interface Stats {
  open: number;
  inProgress: number;
  resolved: number;
  total: number;
}

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: "Open", color: "bg-red-100 text-red-700" },
  in_progress: { label: "In Progress", color: "bg-yellow-100 text-yellow-700" },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-700" },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-600" },
};

const categories = ["general", "plumbing", "electrical", "cleanliness", "security", "parking"];

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<Stats>({ open: 0, inProgress: 0, resolved: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [resolveComplaint, setResolveComplaint] = useState<Complaint | null>(null);
  const [resolution, setResolution] = useState("");
  const [form, setForm] = useState({
    flatNumber: "",
    raisedBy: "",
    title: "",
    description: "",
    category: "general",
    priority: "medium",
  });

  const fetchComplaints = useCallback(() => {
    setLoading(true);
    fetch("/api/complaints")
      .then((r) => r.json())
      .then((d) => {
        setComplaints(d.complaints || []);
        setStats(d.stats || { open: 0, inProgress: 0, resolved: 0, total: 0 });
      })
      .catch(() => toast.error("Failed to load complaints"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Complaint registered");
        setShowForm(false);
        setForm({ flatNumber: "", raisedBy: "", title: "", description: "", category: "general", priority: "medium" });
        fetchComplaints();
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

  const updateStatus = async (id: string, status: string, res?: string) => {
    try {
      const response = await fetch(`/api/complaints/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, resolution: res }),
      });
      if (response.ok) {
        toast.success(`Complaint ${status === "resolved" ? "resolved" : "updated"}`);
        fetchComplaints();
      }
    } catch {
      toast.error("Failed to update");
    }
    setResolveComplaint(null);
    setResolution("");
  };

  const filtered = statusFilter === "all"
    ? complaints
    : complaints.filter((c) => c.status === statusFilter);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Complaints</h1>
          <p className="text-sm text-text-secondary mt-1">
            {stats.open} open · {stats.inProgress} in progress · {stats.resolved} resolved
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm">
          <Plus className="w-4 h-4" /> New Complaint
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="stat-card border-l-4 border-l-danger">
          <p className="text-xs text-text-secondary">Open</p>
          <p className="text-xl font-bold">{stats.open}</p>
        </div>
        <div className="stat-card border-l-4 border-l-warning">
          <p className="text-xs text-text-secondary">In Progress</p>
          <p className="text-xl font-bold">{stats.inProgress}</p>
        </div>
        <div className="stat-card border-l-4 border-l-success">
          <p className="text-xs text-text-secondary">Resolved</p>
          <p className="text-xl font-bold">{stats.resolved}</p>
        </div>
        <div className="stat-card border-l-4 border-l-primary">
          <p className="text-xs text-text-secondary">Total</p>
          <p className="text-xl font-bold">{stats.total}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-text-secondary" />
        <div className="flex gap-1 bg-white border border-border rounded-lg p-0.5">
          {["all", "open", "in_progress", "resolved", "closed"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === s ? "bg-primary text-white" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {s === "all" ? "All" : s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12 text-text-secondary">
          {statusFilter === "all" ? "No complaints yet. 🎉" : `No ${statusFilter} complaints.`}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div key={c.id} className="card card-hover">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{c.title}</h3>
                    <span className={`badge text-[10px] ${statusConfig[c.status]?.color || "bg-gray-100 text-gray-600"}`}>
                      {statusConfig[c.status]?.label || c.status}
                    </span>
                    <span className={`badge text-[10px] ${priorityColors[c.priority] || priorityColors.medium}`}>
                      {c.priority}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mb-2">{c.description}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-text-secondary">
                    <span>Flat: <strong>{c.flatNumber}</strong></span>
                    <span>By: {c.raisedBy}</span>
                    <span>Category: {c.category}</span>
                    <span>{new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                  {c.resolution && (
                    <div className="mt-2 p-2 bg-success-bg rounded-md">
                      <p className="text-xs text-success-text"><strong>Resolution:</strong> {c.resolution}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  {c.status === "open" && (
                    <button
                      onClick={() => updateStatus(c.id, "in_progress")}
                      className="btn btn-secondary btn-sm !py-1 !px-2 text-xs"
                    >
                      <Clock className="w-3 h-3" /> Start
                    </button>
                  )}
                  {(c.status === "open" || c.status === "in_progress") && (
                    <button
                      onClick={() => setResolveComplaint(c)}
                      className="btn btn-success btn-sm !py-1 !px-2 text-xs"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Complaint Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content !max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">
              <AlertTriangle className="w-5 h-5 text-warning inline mr-2" />
              Register Complaint
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Flat Number *</label><input className="input" placeholder="e.g. A-101" value={form.flatNumber} onChange={(e) => setForm({ ...form, flatNumber: e.target.value })} required /></div>
                <div><label className="label">Raised By *</label><input className="input" placeholder="Name" value={form.raisedBy} onChange={(e) => setForm({ ...form, raisedBy: e.target.value })} required /></div>
              </div>
              <div><label className="label">Subject *</label><input className="input" placeholder="Brief title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div><label className="label">Description *</label><textarea className="input !h-auto" rows={3} placeholder="Describe the issue..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Category</label>
                  <select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {categories.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select className="select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? <div className="spinner !w-4 !h-4 !border-white/30 !border-t-white" /> : "Submit Complaint"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {resolveComplaint && (
        <div className="modal-overlay" onClick={() => setResolveComplaint(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Resolve Complaint</h3>
            <p className="text-sm text-text-secondary mb-4">{resolveComplaint.title}</p>
            <div>
              <label className="label">Resolution Note *</label>
              <textarea
                className="input !h-auto"
                rows={3}
                placeholder="How was this resolved?"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setResolveComplaint(null)} className="btn btn-secondary">Cancel</button>
              <button
                onClick={() => updateStatus(resolveComplaint.id, "resolved", resolution)}
                disabled={!resolution.trim()}
                className="btn btn-primary"
              >
                Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
