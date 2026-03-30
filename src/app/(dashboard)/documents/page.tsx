"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { FolderOpen, Plus, FileText, Download, Trash2, Shield, Settings, File } from "lucide-react";

interface Document {
  id: string;
  title: string;
  category: string;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  uploadedBy: string;
  createdAt: string;
}

const categoryConfig: Record<string, { icon: any; color: string; label: string }> = {
  bylaws: { icon: Shield, color: "text-blue-700 bg-blue-100", label: "Bylaws & Rules" },
  noc: { icon: FileText, color: "text-green-700 bg-green-100", label: "NOCs" },
  minutes: { icon: File, color: "text-purple-700 bg-purple-100", label: "Meeting Minutes" },
  financial: { icon: Settings, color: "text-orange-700 bg-orange-100", label: "Financial" },
  general: { icon: FolderOpen, color: "text-gray-700 bg-gray-100", label: "General" }
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", category: "general", fileName: "", fileUrl: "", fileSize: 0 });

  const fetchDocuments = useCallback(() => {
    setLoading(true);
    fetch("/api/documents")
      .then((r) => r.json())
      .then((d) => setDocuments(d.documents || []))
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  // Mock file upload - in a real app this would upload to Supabase/S3 first
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm(f => ({
        ...f,
        fileName: file.name,
        fileSize: file.size,
        // Using a fake URL for now until real storage is integrated
        fileUrl: `https://example.com/docs/${encodeURIComponent(file.name)}` 
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fileUrl) {
      toast.error("Please select a file first");
      return;
    }
    
    setSaving(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Document uploaded");
        setShowForm(false);
        setForm({ title: "", category: "general", fileName: "", fileUrl: "", fileSize: 0 });
        fetchDocuments();
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed");
      }
    } catch { toast.error("Something went wrong"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    toast.success("Document deleted");
    fetchDocuments();
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  // Group by category
  const grouped = documents.reduce<Record<string, Document[]>>((acc, d) => {
    (acc[d.category] = acc[d.category] || []).push(d);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <FolderOpen className="w-6 h-6 text-primary" />
          <div>
            <h1 className="page-title">Document Repository</h1>
            <p className="text-sm text-text-secondary mt-0.5">{documents.length} documents securely stored</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm">
          <Plus className="w-4 h-4" /> Upload Document
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : documents.length === 0 ? (
        <div className="card text-center py-12 text-text-secondary">
          No documents uploaded yet. Keep your society rules, NOCs, and meeting minutes here.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => {
            const config = categoryConfig[category] || categoryConfig.general;
            const Icon = config.icon;
            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-1.5 rounded-lg ${config.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h2 className="font-semibold text-sm text-text-primary">{config.label}</h2>
                  <span className="text-xs text-text-secondary">({items.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((doc) => (
                    <div key={doc.id} className="card card-hover flex flex-col justify-between h-full !p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 shrink-0 rounded-lg bg-surface flex items-center justify-center border border-border">
                            <FileText className="w-5 h-5 text-text-secondary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm line-clamp-2" title={doc.title}>{doc.title}</h3>
                            <p className="text-xs text-text-secondary truncate mt-0.5" title={doc.fileName}>{doc.fileName}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-border pt-3 mt-3">
                        <div className="text-[10px] text-text-secondary">
                          <p>{formatSize(doc.fileSize)}</p>
                          <p>{new Date(doc.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm !py-1 !px-2" title="Download">
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          <button onClick={() => handleDelete(doc.id)} className="btn btn-secondary btn-sm !p-1 text-danger" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Upload Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content !max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Upload Document</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><label className="label">Title *</label><input className="input" placeholder="e.g. Society Bylaws 2024" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div>
                <label className="label">Category *</label>
                <select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {Object.entries(categoryConfig).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">File *</label>
                <input type="file" className="input file:btn file:btn-secondary file:border-0 file:mr-4 file:py-1 file:px-3 text-sm" onChange={handleFileChange} required />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary">{saving ? <div className="spinner !w-4 !h-4 !border-white/30 !border-t-white" /> : "Upload"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
