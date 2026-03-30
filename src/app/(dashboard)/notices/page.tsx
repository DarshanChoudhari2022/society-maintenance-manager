"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Plus, Pin, PinOff, Trash2, Megaphone } from "lucide-react";

interface Notice {
  id: string;
  title: string;
  body: string;
  category: string;
  postedBy: string;
  isPinned: boolean;
  expiresAt: string | null;
  createdAt: string;
}

const categoryColors: Record<string, string> = {
  general: "bg-blue-100 text-blue-700",
  event: "bg-purple-100 text-purple-700",
  maintenance: "bg-orange-100 text-orange-700",
  emergency: "bg-red-100 text-red-700",
  meeting: "bg-green-100 text-green-700",
};

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body: "",
    category: "general",
    isPinned: false,
  });

  const fetchNotices = useCallback(() => {
    setLoading(true);
    fetch("/api/notices")
      .then((r) => r.json())
      .then((d) => setNotices(d.notices || []))
      .catch(() => toast.error("Failed to load notices"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Notice published");
        setShowForm(false);
        setForm({ title: "", body: "", category: "general", isPinned: false });
        fetchNotices();
      } else {
        toast.error("Failed to publish");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const togglePin = async (id: string, isPinned: boolean) => {
    await fetch(`/api/notices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !isPinned }),
    });
    fetchNotices();
  };

  const deleteNotice = async (id: string) => {
    if (!confirm("Delete this notice?")) return;
    await fetch(`/api/notices/${id}`, { method: "DELETE" });
    toast.success("Notice deleted");
    fetchNotices();
  };

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Megaphone className="w-6 h-6 text-primary" />
          <div>
            <h1 className="page-title">Notice Board</h1>
            <p className="text-sm text-text-secondary mt-0.5">{notices.length} notices</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm">
          <Plus className="w-4 h-4" /> Post Notice
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : notices.length === 0 ? (
        <div className="card text-center py-12 text-text-secondary">No notices posted yet.</div>
      ) : (
        <div className="space-y-3">
          {notices.map((n) => (
            <div key={n.id} className={`card ${n.isPinned ? "border-l-4 border-l-primary" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {n.isPinned && <Pin className="w-3 h-3 text-primary" />}
                    <h3 className="font-semibold text-sm">{n.title}</h3>
                    <span className={`badge text-[10px] ${categoryColors[n.category] || categoryColors.general}`}>
                      {n.category}
                    </span>
                  </div>
                  <p className="text-sm text-text-primary mb-2 whitespace-pre-wrap">{n.body}</p>
                  <p className="text-xs text-text-secondary">
                    Posted by {n.postedBy} · {new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => togglePin(n.id, n.isPinned)} className="btn btn-secondary btn-sm !py-1 !px-2 text-xs">
                    {n.isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                  </button>
                  <button onClick={() => deleteNotice(n.id)} className="btn btn-secondary btn-sm !py-1 !px-2 text-xs text-danger">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Notice Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content !max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Post Notice</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><label className="label">Title *</label><input className="input" placeholder="Notice subject" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div><label className="label">Body *</label><textarea className="input !h-auto" rows={5} placeholder="Notice content..." value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Category</label>
                  <select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option value="general">General</option>
                    <option value="event">Event</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="emergency">Emergency</option>
                    <option value="meeting">Meeting</option>
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isPinned} onChange={(e) => setForm({ ...form, isPinned: e.target.checked })} className="w-4 h-4 rounded border-border" />
                    <span className="text-sm font-medium">Pin to top</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? <div className="spinner !w-4 !h-4 !border-white/30 !border-t-white" /> : "Publish Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
