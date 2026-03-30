"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Plus, FileText, Calendar } from "lucide-react";

interface Meeting {
  id: string;
  title: string;
  date: string;
  meetingType: string;
  attendees: string | null;
  agenda: string;
  minutes: string;
  decisions: string | null;
  recordedBy: string;
  createdAt: string;
}

const typeConfig: Record<string, { label: string; color: string }> = {
  agm: { label: "AGM", color: "bg-red-100 text-red-700" },
  sgm: { label: "SGM", color: "bg-orange-100 text-orange-700" },
  committee: { label: "Committee", color: "bg-blue-100 text-blue-700" },
  general: { label: "General", color: "bg-gray-100 text-gray-700" },
};

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    meetingType: "general",
    attendees: "",
    agenda: "",
    minutes: "",
    decisions: "",
  });

  const fetchMeetings = useCallback(() => {
    setLoading(true);
    fetch("/api/meetings")
      .then((r) => r.json())
      .then((d) => setMeetings(d.meetings || []))
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Meeting minutes recorded");
        setShowForm(false);
        setForm({ title: "", date: new Date().toISOString().split("T")[0], meetingType: "general", attendees: "", agenda: "", minutes: "", decisions: "" });
        fetchMeetings();
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed");
      }
    } catch { toast.error("Something went wrong"); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-primary" />
          <div>
            <h1 className="page-title">Meeting Minutes</h1>
            <p className="text-sm text-text-secondary mt-0.5">{meetings.length} meetings recorded</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm">
          <Plus className="w-4 h-4" /> Record Meeting
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : meetings.length === 0 ? (
        <div className="card text-center py-12 text-text-secondary">No meetings recorded yet.</div>
      ) : (
        <div className="space-y-3">
          {meetings.map((m) => {
            const config = typeConfig[m.meetingType] || typeConfig.general;
            const isExpanded = expanded === m.id;
            return (
              <div key={m.id} className="card card-hover cursor-pointer" onClick={() => setExpanded(isExpanded ? null : m.id)}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{m.title}</h3>
                      <span className={`badge text-[10px] ${config.color}`}>{config.label}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-text-secondary">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(m.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      <span>Recorded by: {m.recordedBy}</span>
                    </div>
                  </div>
                  <span className="text-xs text-primary">{isExpanded ? "▲ Less" : "▼ More"}</span>
                </div>

                {isExpanded && (
                  <div className="mt-4 space-y-3 border-t border-border pt-4" onClick={(e) => e.stopPropagation()}>
                    <div>
                      <h4 className="text-xs font-semibold text-text-secondary uppercase mb-1">Agenda</h4>
                      <p className="text-sm whitespace-pre-wrap">{m.agenda}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-text-secondary uppercase mb-1">Minutes</h4>
                      <p className="text-sm whitespace-pre-wrap">{m.minutes}</p>
                    </div>
                    {m.decisions && (
                      <div className="p-3 bg-primary/5 rounded-lg">
                        <h4 className="text-xs font-semibold text-primary uppercase mb-1">Decisions</h4>
                        <p className="text-sm whitespace-pre-wrap">{m.decisions}</p>
                      </div>
                    )}
                    {m.attendees && (
                      <div>
                        <h4 className="text-xs font-semibold text-text-secondary uppercase mb-1">Attendees</h4>
                        <p className="text-sm text-text-secondary">{m.attendees}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Record Meeting Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content !max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Record Meeting Minutes</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2"><label className="label">Title *</label><input className="input" placeholder="Meeting subject" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
                <div><label className="label">Type</label>
                  <select className="select" value={form.meetingType} onChange={(e) => setForm({ ...form, meetingType: e.target.value })}>
                    <option value="general">General</option>
                    <option value="agm">AGM</option>
                    <option value="sgm">SGM</option>
                    <option value="committee">Committee</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="label">Date *</label><input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
                <div><label className="label">Attendees</label><input className="input" placeholder="Names..." value={form.attendees} onChange={(e) => setForm({ ...form, attendees: e.target.value })} /></div>
              </div>
              <div><label className="label">Agenda *</label><textarea className="input !h-auto" rows={3} placeholder="Meeting agenda points..." value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} required /></div>
              <div><label className="label">Minutes *</label><textarea className="input !h-auto" rows={4} placeholder="What was discussed..." value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })} required /></div>
              <div><label className="label">Decisions Made</label><textarea className="input !h-auto" rows={2} placeholder="Key decisions taken..." value={form.decisions} onChange={(e) => setForm({ ...form, decisions: e.target.value })} /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary">{saving ? <div className="spinner !w-4 !h-4 !border-white/30 !border-t-white" /> : "Save Minutes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
