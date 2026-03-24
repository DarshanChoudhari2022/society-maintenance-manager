"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Send, Check, X, MessageSquare } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { defaultTemplates } from "@/lib/whatsapp";

interface PendingFlat {
  id: string;
  flatId: string;
  flatNumber: string;
  ownerName: string;
  contact: string;
  amount: number;
  lastReminder: string | null;
  sent?: boolean;
  failed?: boolean;
}

export default function RemindersPage() {
  const [pendingFlats, setPendingFlats] = useState<PendingFlat[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [template, setTemplate] = useState(defaultTemplates.english);
  const [lang, setLang] = useState<"english" | "marathi">("english");

  const period = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  })();

  useEffect(() => {
    fetch(`/api/maintenance/bills?period=${period}&status=pending`)
      .then((r) => r.json())
      .then((data) => {
        const flats = (data.bills || []).map((b: { id: string; flatId: string; amount: number; flat: { id: string; flatNumber: string; ownerName: string; contact: string } }) => ({
          id: b.id,
          flatId: b.flat.id,
          flatNumber: b.flat.flatNumber,
          ownerName: b.flat.ownerName,
          contact: b.flat.contact,
          amount: b.amount,
          lastReminder: null,
        }));
        setPendingFlats(flats);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

  const sendReminder = async (flatIds: string[]) => {
    try {
      const res = await fetch("/api/reminders/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flatIds, templateBody: template, period }),
      });
      const data = await res.json();

      if (data.sent > 0) {
        toast.success(`Reminders sent to ${data.sent} members`);
        setPendingFlats((prev) =>
          prev.map((f) =>
            flatIds.includes(f.flatId)
              ? { ...f, sent: true, lastReminder: "Just now" }
              : f
          )
        );
      } else {
        toast.error(data.error || "Failed to send reminders");
        setPendingFlats((prev) =>
          prev.map((f) =>
            flatIds.includes(f.flatId) ? { ...f, failed: true } : f
          )
        );
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const sendAll = async () => {
    setSending(true);
    await sendReminder(pendingFlats.map((f) => f.flatId));
    setSending(false);
  };

  const sendSingle = async (flatId: string) => {
    setSendingId(flatId);
    await sendReminder([flatId]);
    setSendingId(null);
  };

  const periodLabel = (() => {
    const [y, m] = period.split("-").map(Number);
    return new Date(y, m - 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  })();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Send Payment Reminders</h1>
          <p className="text-sm text-text-secondary mt-1">
            {periodLabel} — {pendingFlats.length} flats have pending maintenance
          </p>
        </div>
        <button
          onClick={sendAll}
          disabled={sending || pendingFlats.length === 0}
          className="btn btn-primary"
        >
          {sending ? (
            <div className="spinner !w-4 !h-4 !border-white/30 !border-t-white" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send to all {pendingFlats.length} pending
            </>
          )}
        </button>
      </div>

      {/* Template Editor */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Message Template</h3>
          </div>
          <div className="flex gap-1 bg-surface rounded-lg p-0.5">
            {(["english", "marathi"] as const).map((l) => (
              <button
                key={l}
                onClick={() => {
                  setLang(l);
                  setTemplate(defaultTemplates[l]);
                }}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  lang === l ? "bg-white text-primary shadow-sm" : "text-text-secondary"
                }`}
              >
                {l === "english" ? "English" : "मराठी"}
              </button>
            ))}
          </div>
        </div>
        <textarea
          className="input !h-auto font-mono text-xs"
          rows={8}
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
        />
        <p className="text-xs text-text-secondary mt-2">
          Variables: {"{ownerName}"}, {"{flatNumber}"}, {"{societyName}"},{" "}
          {"{amount}"}, {"{period}"}, {"{dueDate}"}, {"{upiId}"},{" "}
          {"{chairmanName}"}
        </p>
      </div>

      {/* Pending Flats List */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : pendingFlats.length === 0 ? (
        <div className="card text-center py-12 text-text-secondary">
          <p>🎉 No pending payments! All flats have paid for {periodLabel}.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Flat</th>
                <th>Owner</th>
                <th>Amount</th>
                <th className="hidden sm:table-cell">Last Reminder</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingFlats.map((f) => (
                <tr key={f.id}>
                  <td className="font-medium">{f.flatNumber}</td>
                  <td>{f.ownerName}</td>
                  <td>{formatCurrency(f.amount)}</td>
                  <td className="hidden sm:table-cell text-text-secondary">
                    {f.lastReminder || "Never"}
                  </td>
                  <td>
                    <div className="flex justify-end">
                      {f.sent ? (
                        <span className="flex items-center gap-1 text-xs text-success font-medium">
                          <Check className="w-3 h-3" /> Sent
                        </span>
                      ) : f.failed ? (
                        <span className="flex items-center gap-1 text-xs text-danger font-medium">
                          <X className="w-3 h-3" /> Failed
                        </span>
                      ) : (
                        <button
                          onClick={() => sendSingle(f.flatId)}
                          disabled={sendingId === f.flatId}
                          className="btn btn-secondary btn-sm !py-1 !px-2 text-xs"
                        >
                          {sendingId === f.flatId ? (
                            <div className="spinner !w-3 !h-3" />
                          ) : (
                            <><Send className="w-3 h-3" /> Send</>
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
