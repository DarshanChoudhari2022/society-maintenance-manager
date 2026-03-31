"use client";

import { useEffect, useState } from "react";
import { UserCheck, Clock, Plus, Calendar, AlertTriangle, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

interface Visitor {
  id: string;
  visitorName: string;
  phone: string | null;
  purpose: string;
  status: string;
  isPreApproved: boolean;
  expectedAt: string | null;
  entryTime: string | null;
  exitTime: string | null;
}

export default function MyVisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    visitorName: "",
    phone: "",
    purpose: "guest",
    expectedAt: new Date().toISOString().slice(0, 16),
  });

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/my-visitors");
      const data = await res.json();
      if (data.visitors) {
        setVisitors(data.visitors);
      }
    } catch {
      toast.error("Failed to load visitors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  const handleAdd = async () => {
    if (!form.visitorName || !form.expectedAt) {
      toast.error("Name and expected time are required");
      return;
    }

    const load = toast.loading("Pre-approving visitor...");
    try {
      const res = await fetch("/api/my-visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Visitor pre-approved successfully", { id: load });
        setShowForm(false);
        setForm({ visitorName: "", phone: "", purpose: "guest", expectedAt: new Date().toISOString().slice(0, 16) });
        fetchVisitors();
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed to add", { id: load });
      }
    } catch {
      toast.error("Something went wrong", { id: load });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="page-header flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <div>
            <h1 className="page-title">Expected Visitors</h1>
            <p className="text-sm text-text-secondary mt-0.5">
              Pre-approve guests to save time at the gate
            </p>
          </div>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary btn-sm flex items-center gap-2"
        >
          {showForm ? "Cancel" : <><Plus className="w-4 h-4" /> Pre-approve Guest</>}
        </button>
      </div>

      {showForm && (
        <div className="card border-l-4 border-l-primary animate-in fade-in zoom-in-95 duration-200">
          <h3 className="font-semibold mb-4 text-sm">Add Expected Visitor</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Visitor Name *</label>
              <input 
                className="input" 
                placeholder="John Doe"
                value={form.visitorName} 
                onChange={(e) => setForm({ ...form, visitorName: e.target.value })} 
              />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input 
                className="input" 
                placeholder="10 digits"
                maxLength={10} 
                value={form.phone} 
                onChange={(e) => setForm({ ...form, phone: e.target.value })} 
              />
            </div>
            <div>
              <label className="label">Purpose</label>
              <select 
                className="select" 
                value={form.purpose} 
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              >
                <option value="guest">Guest / Relative</option>
                <option value="delivery">Delivery</option>
                <option value="service">Service / Repair</option>
                <option value="cab">Cab / Taxi</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Expected Time *</label>
              <input 
                type="datetime-local" 
                className="input" 
                value={form.expectedAt} 
                onChange={(e) => setForm({ ...form, expectedAt: e.target.value })} 
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleAdd} className="btn btn-primary">Save Pre-approval</button>
          </div>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        {loading ? (
           <div className="py-12 flex justify-center"><div className="spinner" /></div>
        ) : visitors.length === 0 ? (
          <div className="p-8 text-center text-text-secondary flex flex-col items-center">
            <Calendar className="w-12 h-12 text-border mb-3" />
            <p>No active or expected visitors for today.</p>
          </div>
        ) : (
          <div className="table-wrapper !border-0 !rounded-none">
            <table className="table">
              <thead>
                <tr>
                  <th>Visitor</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th>Timeline</th>
                </tr>
              </thead>
              <tbody>
                {visitors.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <div className="font-medium">{v.visitorName}</div>
                      {v.phone && <div className="text-xs text-text-secondary">{v.phone}</div>}
                    </td>
                    <td>
                      <span className="capitalize text-sm bg-surface px-2 py-1 rounded-md border border-border">
                        {v.purpose}
                      </span>
                    </td>
                    <td>
                      {v.isPreApproved && v.status === "out" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          <Clock className="w-3 h-3" /> Pre-approved
                        </span>
                      ) : v.status === "in" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          <UserCheck className="w-3 h-3" /> Inside premise
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                          Completed
                        </span>
                      )}
                    </td>
                    <td className="text-sm">
                      {v.status === "in" && v.entryTime ? (
                        <span className="text-success">Entered at {new Date(v.entryTime).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</span>
                      ) : v.isPreApproved && v.expectedAt ? (
                        <span className="text-text-secondary">Expected Today, {new Date(v.expectedAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
