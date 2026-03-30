"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Plus, CalendarCheck, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Facility {
  id: string;
  name: string;
  description: string | null;
  capacity: number | null;
  ratePerHour: number;
  isActive: boolean;
  rules: string | null;
  bookings: Booking[];
}

interface Booking {
  id: string;
  facilityId: string;
  bookedBy: string;
  flatNumber: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string | null;
  status: string;
  amount: number;
  facility?: { name: string };
}

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"facilities" | "bookings">("facilities");
  const [showAddFacility, setShowAddFacility] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [facilityForm, setFacilityForm] = useState({ name: "", description: "", capacity: "", ratePerHour: "", rules: "" });
  const [bookingForm, setBookingForm] = useState({
    facilityId: "",
    flatNumber: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "11:00",
    purpose: "",
  });

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/facilities").then((r) => r.json()),
      fetch("/api/facilities/bookings").then((r) => r.json()),
    ])
      .then(([facData, bookData]) => {
        setFacilities(facData.facilities || []);
        setBookings(bookData.bookings || []);
      })
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/facilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(facilityForm),
      });
      if (res.ok) {
        toast.success("Facility added");
        setShowAddFacility(false);
        setFacilityForm({ name: "", description: "", capacity: "", ratePerHour: "", rules: "" });
        fetchData();
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed");
      }
    } catch { toast.error("Something went wrong"); }
    finally { setSaving(false); }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/facilities/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingForm),
      });
      if (res.ok) {
        toast.success("Booking confirmed!");
        setShowBooking(false);
        setBookingForm({ facilityId: "", flatNumber: "", date: new Date().toISOString().split("T")[0], startTime: "09:00", endTime: "11:00", purpose: "" });
        fetchData();
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
          <CalendarCheck className="w-6 h-6 text-primary" />
          <div>
            <h1 className="page-title">Facility Booking</h1>
            <p className="text-sm text-text-secondary mt-0.5">{facilities.length} facilities available</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddFacility(true)} className="btn btn-secondary btn-sm">
            <Plus className="w-4 h-4" /> Add Facility
          </button>
          <button onClick={() => setShowBooking(true)} className="btn btn-primary btn-sm" disabled={facilities.length === 0}>
            <CalendarCheck className="w-4 h-4" /> Book Now
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-border rounded-lg p-0.5 mb-6 w-fit">
        {(["facilities", "bookings"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === t ? "bg-primary text-white" : "text-text-secondary hover:text-text-primary"}`}>
            {t === "facilities" ? "Facilities" : "Bookings"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : tab === "facilities" ? (
        facilities.length === 0 ? (
          <div className="card text-center py-12 text-text-secondary">No facilities added yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {facilities.map((f) => (
              <div key={f.id} className="card card-hover">
                <h3 className="font-semibold text-sm mb-1">{f.name}</h3>
                {f.description && <p className="text-xs text-text-secondary mb-2">{f.description}</p>}
                <div className="flex flex-wrap gap-2 text-xs text-text-secondary mb-3">
                  {f.capacity && <span>👥 Capacity: {f.capacity}</span>}
                  <span>💰 {f.ratePerHour > 0 ? `${formatCurrency(f.ratePerHour)}/hr` : "Free"}</span>
                </div>
                {f.bookings.length > 0 && (
                  <div className="border-t border-border pt-2">
                    <p className="text-[10px] text-text-secondary uppercase font-semibold mb-1">Upcoming</p>
                    {f.bookings.slice(0, 3).map((b) => (
                      <div key={b.id} className="flex items-center gap-2 text-xs text-text-secondary py-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(b.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} · {b.startTime}–{b.endTime} · Flat {b.flatNumber}</span>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => { setBookingForm({ ...bookingForm, facilityId: f.id }); setShowBooking(true); }} className="btn btn-primary btn-sm w-full mt-3">
                  Book {f.name}
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        bookings.length === 0 ? (
          <div className="card text-center py-12 text-text-secondary">No bookings yet.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Facility</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Flat</th>
                  <th className="hidden sm:table-cell">Booked By</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td className="font-medium">{b.facility?.name || "—"}</td>
                    <td className="text-text-secondary">{new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                    <td>{b.startTime}–{b.endTime}</td>
                    <td className="font-medium">{b.flatNumber}</td>
                    <td className="hidden sm:table-cell text-text-secondary">{b.bookedBy}</td>
                    <td className="text-right font-medium">{b.amount > 0 ? formatCurrency(b.amount) : "Free"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Add Facility Modal */}
      {showAddFacility && (
        <div className="modal-overlay" onClick={() => setShowAddFacility(false)}>
          <div className="modal-content !max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Add Facility</h3>
            <form onSubmit={handleAddFacility} className="space-y-3">
              <div><label className="label">Name *</label><input className="input" placeholder="e.g. Clubhouse, Gym" value={facilityForm.name} onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })} required /></div>
              <div><label className="label">Description</label><input className="input" placeholder="Brief description" value={facilityForm.description} onChange={(e) => setFacilityForm({ ...facilityForm, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Capacity</label><input type="number" className="input" placeholder="50" value={facilityForm.capacity} onChange={(e) => setFacilityForm({ ...facilityForm, capacity: e.target.value })} /></div>
                <div><label className="label">Rate/Hour (₹)</label><input type="number" className="input" placeholder="0 = Free" value={facilityForm.ratePerHour} onChange={(e) => setFacilityForm({ ...facilityForm, ratePerHour: e.target.value })} /></div>
              </div>
              <div><label className="label">Rules</label><textarea className="input !h-auto" rows={2} placeholder="Booking rules..." value={facilityForm.rules} onChange={(e) => setFacilityForm({ ...facilityForm, rules: e.target.value })} /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddFacility(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary">{saving ? <div className="spinner !w-4 !h-4 !border-white/30 !border-t-white" /> : "Add Facility"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book Facility Modal */}
      {showBooking && (
        <div className="modal-overlay" onClick={() => setShowBooking(false)}>
          <div className="modal-content !max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Book Facility</h3>
            <form onSubmit={handleBook} className="space-y-3">
              <div>
                <label className="label">Facility *</label>
                <select className="select" value={bookingForm.facilityId} onChange={(e) => setBookingForm({ ...bookingForm, facilityId: e.target.value })} required>
                  <option value="">Select...</option>
                  {facilities.filter((f) => f.isActive).map((f) => (
                    <option key={f.id} value={f.id}>{f.name} {f.ratePerHour > 0 ? `(${formatCurrency(f.ratePerHour)}/hr)` : "(Free)"}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Flat Number *</label><input className="input" placeholder="A-101" value={bookingForm.flatNumber} onChange={(e) => setBookingForm({ ...bookingForm, flatNumber: e.target.value })} required /></div>
                <div><label className="label">Date *</label><input type="date" className="input" value={bookingForm.date} onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Start Time *</label><input type="time" className="input" value={bookingForm.startTime} onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })} required /></div>
                <div><label className="label">End Time *</label><input type="time" className="input" value={bookingForm.endTime} onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })} required /></div>
              </div>
              <div><label className="label">Purpose</label><input className="input" placeholder="What for?" value={bookingForm.purpose} onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })} /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowBooking(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary">{saving ? <div className="spinner !w-4 !h-4 !border-white/30 !border-t-white" /> : "Confirm Booking"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
