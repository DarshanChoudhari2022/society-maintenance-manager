"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Plus, Phone, Trash2, PhoneCall } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  phone: string;
  category: string;
  address: string | null;
  isAvailable: boolean;
  notes: string | null;
}

const categoryConfig: Record<string, { icon: string; color: string; label: string }> = {
  plumber: { icon: "🔧", color: "bg-blue-100 text-blue-700", label: "Plumber" },
  electrician: { icon: "⚡", color: "bg-yellow-100 text-yellow-700", label: "Electrician" },
  ambulance: { icon: "🚑", color: "bg-red-100 text-red-700", label: "Ambulance" },
  fire: { icon: "🚒", color: "bg-orange-100 text-orange-700", label: "Fire" },
  police: { icon: "👮", color: "bg-blue-100 text-blue-800", label: "Police" },
  hospital: { icon: "🏥", color: "bg-green-100 text-green-700", label: "Hospital" },
  pest_control: { icon: "🐛", color: "bg-purple-100 text-purple-700", label: "Pest Control" },
  carpenter: { icon: "🪚", color: "bg-amber-100 text-amber-700", label: "Carpenter" },
  gas: { icon: "🔥", color: "bg-red-100 text-red-600", label: "Gas Agency" },
  water_tanker: { icon: "💧", color: "bg-cyan-100 text-cyan-700", label: "Water Tanker" },
  other: { icon: "📞", color: "bg-gray-100 text-gray-700", label: "Other" },
};

export default function EmergencyPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", category: "plumber", address: "", notes: "" });

  const fetchContacts = useCallback(() => {
    setLoading(true);
    fetch("/api/emergency")
      .then((r) => r.json())
      .then((d) => setContacts(d.contacts || []))
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Contact added");
        setShowForm(false);
        setForm({ name: "", phone: "", category: "plumber", address: "", notes: "" });
        fetchContacts();
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed");
      }
    } catch { toast.error("Something went wrong"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this contact?")) return;
    await fetch(`/api/emergency/${id}`, { method: "DELETE" });
    toast.success("Contact deleted");
    fetchContacts();
  };

  // Group by category
  const grouped = contacts.reduce<Record<string, Contact[]>>((acc, c) => {
    (acc[c.category] = acc[c.category] || []).push(c);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Phone className="w-6 h-6 text-danger" />
          <div>
            <h1 className="page-title">Emergency Contacts</h1>
            <p className="text-sm text-text-secondary mt-0.5">{contacts.length} contacts saved</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm">
          <Plus className="w-4 h-4" /> Add Contact
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : contacts.length === 0 ? (
        <div className="card text-center py-12 text-text-secondary">
          No emergency contacts added yet. Add important contacts for your society.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => {
            const config = categoryConfig[category] || categoryConfig.other;
            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{config.icon}</span>
                  <h2 className="font-semibold text-sm text-text-primary">{config.label}</h2>
                  <span className="text-xs text-text-secondary">({items.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((c) => (
                    <div key={c.id} className="card card-hover !p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm">{c.name}</h3>
                            {!c.isAvailable && <span className="badge text-[10px] bg-red-100 text-red-700">Unavailable</span>}
                          </div>
                          <a href={`tel:${c.phone}`} className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                            <PhoneCall className="w-3 h-3" /> {c.phone}
                          </a>
                          {c.address && <p className="text-xs text-text-secondary mt-1">{c.address}</p>}
                          {c.notes && <p className="text-xs text-text-secondary mt-0.5 italic">{c.notes}</p>}
                        </div>
                        <div className="flex gap-1">
                          <a href={`tel:${c.phone}`} className="btn btn-success btn-sm !py-1 !px-2">
                            <PhoneCall className="w-3 h-3" />
                          </a>
                          <button onClick={() => handleDelete(c.id)} className="btn btn-secondary btn-sm !py-1 !px-2 text-danger">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Contact Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content !max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Add Emergency Contact</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Name *</label><input className="input" placeholder="Contact name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                <div><label className="label">Phone *</label><input className="input" placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></div>
              </div>
              <div>
                <label className="label">Category *</label>
                <select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {Object.entries(categoryConfig).map(([key, val]) => (
                    <option key={key} value={key}>{val.icon} {val.label}</option>
                  ))}
                </select>
              </div>
              <div><label className="label">Address</label><input className="input" placeholder="Location/address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div><label className="label">Notes</label><input className="input" placeholder="e.g. 24/7 available" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary">{saving ? <div className="spinner !w-4 !h-4 !border-white/30 !border-t-white" /> : "Add Contact"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
