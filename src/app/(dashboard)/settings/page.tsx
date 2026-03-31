"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Settings as SettingsIcon, Save, Shield, Building2, IndianRupee, Bell, Users, Palette } from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"profile" | "maintenance" | "roles">("profile");
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
        toast.success("Settings saved successfully");
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
    <div className="max-w-3xl mx-auto">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-6 h-6 text-primary" />
          <div>
            <h1 className="page-title">Settings</h1>
            <p className="text-sm text-text-secondary mt-0.5">
              Configure your society and billing preferences
            </p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm">
          {saving ? <div className="spinner !w-4 !h-4 !border-white/30 !border-t-white" /> : <><Save className="w-4 h-4" /> Save Changes</>}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-border rounded-lg p-0.5 mb-6 w-fit">
        {([
          { id: "profile" as const, label: "Society Profile", icon: Building2 },
          { id: "maintenance" as const, label: "Billing & Fees", icon: IndianRupee },
          { id: "roles" as const, label: "Roles & Access", icon: Shield },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
              tab === t.id ? "bg-primary text-white" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" ? (
        <div className="card">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            Society Profile
          </h3>
          <div className="space-y-4">
            <div>
              <label className="label">Society Name *</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Full Address *</label>
              <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">City *</label>
                <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <label className="label">Pincode *</label>
                <input className="input" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
              </div>
            </div>
            <div className="border-t border-border pt-4 mt-4">
              <h4 className="text-sm font-medium mb-3">Payment Details</h4>
              <div className="space-y-3">
                <div>
                  <label className="label">UPI ID</label>
                  <input className="input" placeholder="yourname@upi" value={form.upiId} onChange={(e) => setForm({ ...form, upiId: e.target.value })} />
                  <p className="text-xs text-text-secondary mt-1">Shown on receipts for easy payment</p>
                </div>
                <div>
                  <label className="label">Bank Details</label>
                  <input className="input" placeholder="Bank A/C & IFSC for NEFT" value={form.bankDetails} onChange={(e) => setForm({ ...form, bankDetails: e.target.value })} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : tab === "maintenance" ? (
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-primary" />
              Billing Configuration
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label">Monthly Maintenance Amount (₹) *</label>
                <input type="number" className="input" value={form.maintenanceAmt} onChange={(e) => setForm({ ...form, maintenanceAmt: e.target.value })} />
                <p className="text-xs text-text-secondary mt-1">This amount will be billed to every active flat each month</p>
              </div>
              <div>
                <label className="label">Default Due Date (day of month)</label>
                <select className="select" value={form.dueDayOfMonth} onChange={(e) => setForm({ ...form, dueDayOfMonth: e.target.value })}>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{d}th of every month</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="card border-l-4 border-l-danger">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-danger" />
              Late Fee Configuration
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label">Late Fee Amount (₹ per bill)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="e.g. 200"
                  value={form.lateFee}
                  onChange={(e) => setForm({ ...form, lateFee: e.target.value })}
                />
                <p className="text-xs text-text-secondary mt-1">
                  This amount will be added to bills that are past due date. Applied once per bill.
                </p>
              </div>
              <div className="p-3 bg-warning-bg/50 rounded-lg">
                <p className="text-xs text-warning-text">
                  <strong>How it works:</strong> Use the &quot;Apply Late Fees&quot; button on the dashboard to charge overdue bills. 
                  Late fees are added to the bill amount and can be seen in the maintenance table. Set to 0 or leave empty to disable.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Role Permissions
          </h3>
          <p className="text-sm text-text-secondary mb-4">
            Each user has a role that determines what they can access. Roles are assigned during user registration.
          </p>
          <div className="table-wrapper !border-0">
            <table className="table">
              <thead>
                <tr>
                  <th>Module</th>
                  <th className="text-center">Chairman</th>
                  <th className="text-center">Secretary</th>
                  <th className="text-center">Treasurer</th>
                  <th className="text-center">Member</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { module: "Dashboard", c: true, s: true, t: true, m: true },
                  { module: "Members & Flats", c: true, s: true, t: true, m: false },
                  { module: "Maintenance Bills", c: true, s: true, t: true, m: true },
                  { module: "Expenses", c: true, s: false, t: true, m: false },
                  { module: "Reports", c: true, s: true, t: true, m: false },
                  { module: "Notices", c: true, s: true, t: true, m: true },
                  { module: "Complaints", c: true, s: true, t: true, m: true },
                  { module: "Reminders", c: true, s: true, t: true, m: false },
                  { module: "Visitors", c: true, s: true, t: true, m: true },
                  { module: "Parking", c: true, s: true, t: true, m: true },
                  { module: "Facilities", c: true, s: true, t: true, m: true },
                  { module: "Polls", c: true, s: true, t: true, m: true },
                  { module: "Documents", c: true, s: true, t: true, m: true },
                  { module: "Activity Log", c: true, s: true, t: true, m: false },
                  { module: "Settings", c: true, s: false, t: false, m: false },
                ].map(({ module, c, s, t, m }) => (
                  <tr key={module}>
                    <td className="font-medium text-sm">{module}</td>
                    {[c, s, t, m].map((has, i) => (
                      <td key={i} className="text-center">
                        <span className={`inline-block w-5 h-5 rounded-full ${has ? "bg-success-bg text-success" : "bg-border text-text-secondary"} text-xs flex items-center justify-center mx-auto`}>
                          {has ? "✓" : "–"}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
