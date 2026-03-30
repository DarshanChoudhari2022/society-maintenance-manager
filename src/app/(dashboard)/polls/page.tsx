"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Plus, Vote, BarChart3, Lock, Share2 } from "lucide-react";

interface Poll {
  id: string;
  title: string;
  description: string | null;
  options: string;
  votes: string;
  voters: string;
  createdBy: string;
  status: string;
  closesAt: string | null;
  createdAt: string;
}

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [voteFlat, setVoteFlat] = useState("");
  const [userRole, setUserRole] = useState("member");
  const [form, setForm] = useState({ title: "", description: "", options: ["", ""], closesAt: "" });

  const fetchPolls = useCallback(() => {
    setLoading(true);
    
    // Also fetch user role
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setUserRole(d.user.role);
      })
      .catch(() => {});
    fetch("/api/polls")
      .then((r) => r.json())
      .then((d) => setPolls(d.polls || []))
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchPolls(); }, [fetchPolls]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = form.options.filter((o) => o.trim());
    if (validOptions.length < 2) {
      toast.error("At least 2 options required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, options: validOptions }),
      });
      if (res.ok) {
        toast.success("Poll created");
        setShowForm(false);
        setForm({ title: "", description: "", options: ["", ""], closesAt: "" });
        fetchPolls();
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed");
      }
    } catch { toast.error("Something went wrong"); }
    finally { setSaving(false); }
  };

  const handleVote = async (pollId: string, optionIndex: number) => {
    if (!voteFlat.trim()) {
      toast.error("Enter your flat number to vote");
      return;
    }
    try {
      const res = await fetch(`/api/polls/${pollId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote: optionIndex, flatNumber: voteFlat }),
      });
      if (res.ok) {
        toast.success("Vote recorded!");
        fetchPolls();
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed to vote");
      }
    } catch { toast.error("Something went wrong"); }
  };

  const closePoll = async (id: string) => {
    await fetch(`/api/polls/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "closed" }),
    });
    toast.success("Poll closed");
    fetchPolls();
  };

  const addOption = () => setForm({ ...form, options: [...form.options, ""] });
  const removeOption = (i: number) => setForm({ ...form, options: form.options.filter((_, idx) => idx !== i) });
  const updateOption = (i: number, val: string) => {
    const updated = [...form.options];
    updated[i] = val;
    setForm({ ...form, options: updated });
  };

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Vote className="w-6 h-6 text-primary" />
          <div>
            <h1 className="page-title">Polls & Voting</h1>
            <p className="text-sm text-text-secondary mt-0.5">{polls.filter((p) => p.status === "active").length} active polls</p>
          </div>
        </div>
        {userRole !== "member" && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm">
            <Plus className="w-4 h-4" /> Create Poll
          </button>
        )}
      </div>

      {/* Vote flat input */}
      <div className="card mb-6">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-text-primary whitespace-nowrap">Your Flat:</label>
          <input className="input !w-auto max-w-[150px]" placeholder="e.g. A-101" value={voteFlat} onChange={(e) => setVoteFlat(e.target.value)} />
          <p className="text-xs text-text-secondary">Enter your flat number to vote on polls</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : polls.length === 0 ? (
        <div className="card text-center py-12 text-text-secondary">No polls created yet.</div>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => {
            const options: string[] = JSON.parse(poll.options);
            const votes: Record<string, number> = JSON.parse(poll.votes);
            const voters: string[] = JSON.parse(poll.voters);
            const totalVotes = Object.values(votes).reduce((s, v) => s + v, 0);
            const hasVoted = voteFlat && voters.includes(voteFlat);
            const isClosed = poll.status === "closed";
            const showResults = isClosed || hasVoted || userRole === "chairman";

            const shareOnWhatsApp = () => {
              const optionsList = options.map((o, i) => `${i + 1}. ${o}`).join("\n");
              const text = `*New Society Poll: ${poll.title}*\n${poll.description ? `\n_${poll.description}_\n` : "\n"}Options:\n${optionsList}\n\nPlease login to the Society Dashboard to cast your vote!`;
              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
            };

            return (
              <div key={poll.id} className={`card ${isClosed ? "opacity-80" : ""}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{poll.title}</h3>
                      {isClosed ? (
                        <span className="badge text-[10px] bg-gray-100 text-gray-600"><Lock className="w-2.5 h-2.5" /> Closed</span>
                      ) : (
                        <span className="badge text-[10px] bg-green-100 text-green-700">Active</span>
                      )}
                    </div>
                    {poll.description && <p className="text-sm text-text-secondary">{poll.description}</p>}
                    <p className="text-xs text-text-secondary mt-1">
                      By {poll.createdBy} · {totalVotes} votes
                      {poll.closesAt && ` · Closes ${new Date(poll.closesAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={shareOnWhatsApp} className="btn btn-secondary btn-sm !py-1 !px-2 text-xs flex items-center gap-1 hover:text-green-600">
                      <Share2 className="w-3 h-3" /> Share
                    </button>
                    {!isClosed && userRole !== "member" && (
                      <button onClick={() => closePoll(poll.id)} className="btn btn-secondary btn-sm !py-1 !px-2 text-xs text-danger hover:bg-danger/10">
                        <Lock className="w-3 h-3" /> Close
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {options.map((option, i) => {
                    const voteCount = votes[i.toString()] || 0;
                    const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                    const isWinner = isClosed && voteCount === Math.max(...Object.values(votes));

                    return (
                      <div key={i} className="relative">
                        {showResults ? (
                          <div className={`rounded-lg border p-3 ${isWinner && isClosed ? "border-primary bg-primary/5" : "border-border"}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-sm font-medium ${isWinner && isClosed ? "text-primary" : ""}`}>{option}</span>
                              <span className="text-xs font-semibold">{percentage}% ({voteCount})</span>
                            </div>
                            <div className="progress-bar !h-2">
                              <div className="progress-bar-fill" style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleVote(poll.id, i)}
                            disabled={!voteFlat}
                            className="w-full text-left rounded-lg border border-border p-3 hover:border-primary hover:bg-primary/5 transition-colors text-sm"
                          >
                            {option}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                {hasVoted && <p className="text-xs text-success mt-2">✓ You voted from Flat {voteFlat}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Poll Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content !max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Create Poll</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><label className="label">Question *</label><input className="input" placeholder="What do you want to ask?" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div><label className="label">Description</label><input className="input" placeholder="Additional context" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div>
                <label className="label">Options *</label>
                {form.options.map((o, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input className="input" placeholder={`Option ${i + 1}`} value={o} onChange={(e) => updateOption(i, e.target.value)} required />
                    {form.options.length > 2 && (
                      <button type="button" onClick={() => removeOption(i)} className="text-danger text-sm px-2">✕</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addOption} className="text-sm text-primary hover:underline">+ Add option</button>
              </div>
              <div><label className="label">Closes On</label><input type="date" className="input" value={form.closesAt} onChange={(e) => setForm({ ...form, closesAt: e.target.value })} /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary">{saving ? <div className="spinner !w-4 !h-4 !border-white/30 !border-t-white" /> : "Create Poll"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
