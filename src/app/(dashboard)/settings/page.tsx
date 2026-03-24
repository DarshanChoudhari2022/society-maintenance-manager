"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Settings as SettingsIcon, Save } from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"profile" | "maintenance">("profile");
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    pincode: "",
    upiId: "",
    bankDetails: "",
    maintenanceAmt: "",
    dueDayOfMonth: "10",
    lateFee: "",
  });

  useEffect(() => {
    fetch("/api/maintenance/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.society) {
          setForm({
            name: d.society.name || "",
            address: d.society.address || "",
            city: d.society.city || "",
            pincode: d.society.pincode || "",
            upiId: d.society.upiId || "",
            bankDetails: d.society.bankDetails || "",
            maintenanceAmt: d.society.maintenanceAmt?.toString() || "",
            dueDayOfMonth: d.society.dueDayOfMonth?.toString() || "10",
            lateFee: d.society.lateFee?.toString() || "",
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/maintenance/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Settings saved");
      } else {
        toast.error("Failed to save settings");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="spinner" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-6 h-6 text-primary" />
          <h1 className="page-title">Settings</h1>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm">
          {saving ? <div className="spinner !w-4 !h-4 !border-white/30 !border-t-white" /> : <><Save className="w-4 h-4" /> Save Changes</>}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-border rounded-lg p-0.5 mb-6 w-fit">
        {(["profile", "maintenance"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === t ? "bg-primary text-white" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {t === "profile" ? "Society Profile" : "Maintenance Settings"}
          </button>
        ))}
      </div>

      <div className="card">
        {tab === "profile" ? (
          <div className="space-y-4">
            <div><label className="label">Society Name *</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="label">Full Address *</label><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">City *</label><input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div><label className="label">Pincode *</label><input className="input" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} /></div>
            </div>
            <div><label className="label">UPI ID</label><input className="input" placeholder="yourname@upi" value={form.upiId} onChange={(e) => setForm({ ...form, upiId: e.target.value })} /></div>
            <div><label className="label">Bank Details</label><input className="input" placeholder="Shown on receipts" value={form.bankDetails} onChange={(e) => setForm({ ...form, bankDetails: e.target.value })} /></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div><label className="label">Monthly Maintenance Amount (₹) *</label><input type="number" className="input" value={form.maintenanceAmt} onChange={(e) => setForm({ ...form, maintenanceAmt: e.target.value })} /></div>
            <div>
              <label className="label">Default Due Date (day of month)</label>
              <select className="select" value={form.dueDayOfMonth} onChange={(e) => setForm({ ...form, dueDayOfMonth: e.target.value })}>
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>{d}th</option>
                ))}
              </select>
            </div>
            <div><label className="label">Late Fee After Due Date (₹)</label><input type="number" className="input" placeholder="Optional" value={form.lateFee} onChange={(e) => setForm({ ...form, lateFee: e.target.value })} /></div>
          </div>
        )}
      </div>
    </div>
  );
}
