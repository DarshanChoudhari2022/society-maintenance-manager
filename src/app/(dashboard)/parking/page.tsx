"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Plus, Car, Trash2 } from "lucide-react";

interface ParkingSlot {
  id: string;
  slotNumber: string;
  slotType: string;
  wing: string | null;
  isAssigned: boolean;
  vehicleNo: string | null;
  flat?: { flatNumber: string; ownerName: string } | null;
}

const typeIcons: Record<string, string> = {
  car: "🚗",
  bike: "🏍️",
  ev: "⚡",
};

export default function ParkingPage() {
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [stats, setStats] = useState({ total: 0, assigned: 0, available: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAssign, setShowAssign] = useState<ParkingSlot | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ slotNumber: "", slotType: "car", wing: "" });
  const [assignForm, setAssignForm] = useState({ flatNumber: "", vehicleNo: "" });

  const fetchSlots = useCallback(() => {
    setLoading(true);
    fetch("/api/parking")
      .then((r) => r.json())
      .then((d) => {
        setSlots(d.slots || []);
        setStats(d.stats || { total: 0, assigned: 0, available: 0 });
      })
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/parking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Slot added");
        setShowForm(false);
        setForm({ slotNumber: "", slotType: "car", wing: "" });
        fetchSlots();
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed");
      }
    } catch { toast.error("Something went wrong"); }
    finally { setSaving(false); }
  };

  const handleAssign = async () => {
    if (!showAssign) return;
    try {
      const res = await fetch(`/api/parking/${showAssign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...assignForm, isAssigned: true }),
      });
      if (res.ok) {
        toast.success("Slot assigned");
        fetchSlots();
      }
    } catch { toast.error("Failed"); }
    setShowAssign(null);
  };

  const handleUnassign = async (id: string) => {
    try {
      await fetch(`/api/parking/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAssigned: false }),
      });
      toast.success("Slot freed");
      fetchSlots();
    } catch { toast.error("Failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this slot?")) return;
    await fetch(`/api/parking/${id}`, { method: "DELETE" });
    toast.success("Slot deleted");
    fetchSlots();
  };

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Car className="w-6 h-6 text-primary" />
          <div>
            <h1 className="page-title">Parking Management</h1>
            <p className="text-sm text-text-secondary mt-0.5">
              {stats.assigned} assigned · {stats.available} available · {stats.total} total
            </p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm">
          <Plus className="w-4 h-4" /> Add Slot
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card border-l-4 border-l-primary">
          <p className="text-xs text-text-secondary">Total Slots</p>
          <p className="text-2xl font-bold mt-1">{stats.total}</p>
        </div>
        <div className="stat-card border-l-4 border-l-success">
          <p className="text-xs text-text-secondary">Assigned</p>
          <p className="text-2xl font-bold mt-1">{stats.assigned}</p>
        </div>
        <div className="stat-card border-l-4 border-l-warning">
          <p className="text-xs text-text-secondary">Available</p>
          <p className="text-2xl font-bold mt-1">{stats.available}</p>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : slots.length === 0 ? (
        <div className="card text-center py-12 text-text-secondary">
          No parking slots configured yet. Add slots to start managing parking.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className={`card card-hover !p-4 text-center cursor-pointer ${
                slot.isAssigned ? "border-l-4 border-l-primary bg-primary/5" : "border-l-4 border-l-success"
              }`}
            >
              <div className="text-2xl mb-1">{typeIcons[slot.slotType] || "🅿️"}</div>
              <p className="font-bold text-sm">{slot.slotNumber}</p>
              {slot.wing && <p className="text-[10px] text-text-secondary">Wing {slot.wing}</p>}
              {slot.isAssigned ? (
                <div className="mt-2">
                  <p className="text-xs font-medium text-primary">{slot.flat?.flatNumber || "—"}</p>
                  <p className="text-[10px] text-text-secondary">{slot.vehicleNo || ""}</p>
                  <button onClick={() => handleUnassign(slot.id)} className="mt-2 text-[10px] text-danger hover:underline">Free</button>
                </div>
              ) : (
                <div className="mt-2">
                  <span className="text-[10px] text-success font-medium">Available</span>
                  <div className="flex gap-1 mt-1 justify-center">
                    <button onClick={() => { setShowAssign(slot); setAssignForm({ flatNumber: "", vehicleNo: "" }); }} className="text-[10px] text-primary hover:underline">Assign</button>
                    <button onClick={() => handleDelete(slot.id)} className="text-[10px] text-danger hover:underline"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Slot Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Add Parking Slot</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <div><label className="label">Slot Number *</label><input className="input" placeholder="P-01" value={form.slotNumber} onChange={(e) => setForm({ ...form, slotNumber: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Type</label>
                  <select className="select" value={form.slotType} onChange={(e) => setForm({ ...form, slotType: e.target.value })}>
                    <option value="car">🚗 Car</option>
                    <option value="bike">🏍️ Bike</option>
                    <option value="ev">⚡ EV</option>
                  </select>
                </div>
                <div><label className="label">Wing</label><input className="input" placeholder="A, B..." value={form.wing} onChange={(e) => setForm({ ...form, wing: e.target.value })} /></div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary">{saving ? <div className="spinner !w-4 !h-4 !border-white/30 !border-t-white" /> : "Add Slot"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Slot Modal */}
      {showAssign && (
        <div className="modal-overlay" onClick={() => setShowAssign(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Assign Slot {showAssign.slotNumber}</h3>
            <div className="space-y-3">
              <div><label className="label">Flat Number *</label><input className="input" placeholder="A-101" value={assignForm.flatNumber} onChange={(e) => setAssignForm({ ...assignForm, flatNumber: e.target.value })} /></div>
              <div><label className="label">Vehicle Number</label><input className="input" placeholder="MH12AB1234" value={assignForm.vehicleNo} onChange={(e) => setAssignForm({ ...assignForm, vehicleNo: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowAssign(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleAssign} disabled={!assignForm.flatNumber} className="btn btn-primary">Assign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
