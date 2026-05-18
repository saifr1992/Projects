import { Download, FileText, Loader2, Search, Trash2, Upload, X } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { API_BASE_URL, api, extractError, tokenStore } from "../lib/api";
import type { Paper } from "../lib/types";

export function PapersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [papers, setPapers] = useState<Paper[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [yearFilter, setYearFilter] = useState<string>("");

  const [showUpload, setShowUpload] = useState(false);

  async function load() {
    setLoading(true);
    const params: Record<string, string | number> = {};
    if (search) params.q = search;
    if (subjectFilter) params.subject = subjectFilter;
    if (yearFilter) params.year = Number(yearFilter);
    try {
      const [paperRes, subjectRes] = await Promise.all([
        api.get<Paper[]>("/api/papers", { params }),
        api.get<string[]>("/api/papers/subjects"),
      ]);
      setPapers(paperRes.data);
      setSubjects(subjectRes.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    load();
  }

  async function handleDownload(paper: Paper) {
    const token = tokenStore.get();
    const resp = await fetch(`${API_BASE_URL}/api/papers/${paper.id}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) return;
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = paper.file_name;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete(paper: Paper) {
    if (!confirm(`Delete "${paper.title}"?`)) return;
    await api.delete(`/api/papers/${paper.id}`);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Past papers</h1>
          <p className="mt-1 text-sm text-slate-500">Browse, search, and download exam papers.</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowUpload(true)}>
            <Upload className="h-4 w-4" /> Upload paper
          </button>
        )}
      </div>

      <form onSubmit={handleSearch} className="card flex flex-col gap-3 p-4 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="label">Search</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
              placeholder="Title or description…"
            />
          </div>
        </div>
        <div className="w-full md:w-48">
          <label className="label">Subject</label>
          <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="input">
            <option value="">All subjects</option>
            {subjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="w-full md:w-32">
          <label className="label">Year</label>
          <input
            type="number"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="input"
            placeholder="2024"
          />
        </div>
        <button type="submit" className="btn-primary">Apply</button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      ) : papers.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-12 text-center">
          <FileText className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500">No papers match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {papers.map((p) => (
            <article key={p.id} className="card flex flex-col p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <FileText className="h-5 w-5" />
                </div>
                <span className="badge-brand">{p.year}</span>
              </div>
              <h3 className="mb-1 line-clamp-2 font-semibold text-slate-900">{p.title}</h3>
              <p className="mb-3 text-xs text-slate-500">
                {p.subject}
                {p.semester ? ` · ${p.semester}` : ""}
              </p>
              {p.description && (
                <p className="mb-4 line-clamp-2 text-sm text-slate-600">{p.description}</p>
              )}
              <div className="mt-auto flex gap-2">
                <button onClick={() => handleDownload(p)} className="btn-secondary flex-1">
                  <Download className="h-4 w-4" /> Download
                </button>
                {isAdmin && (
                  <button onClick={() => handleDelete(p)} className="btn-ghost px-2 text-rose-600 hover:bg-rose-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUploaded={load} />}
    </div>
  );
}

function UploadModal({ onClose, onUploaded }: { onClose: () => void; onUploaded: () => void }) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [semester, setSemester] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please select a PDF file");
      return;
    }
    setSubmitting(true);
    setError(null);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("subject", subject);
    formData.append("year", String(year));
    if (semester) formData.append("semester", semester);
    if (description) formData.append("description", description);
    formData.append("file", file);
    try {
      await api.post("/api/papers", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUploaded();
      onClose();
    } catch (err) {
      setError(extractError(err, "Upload failed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <div className="card w-full max-w-lg p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Upload past paper</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required className="input" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="label">Subject</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} required className="input" />
            </div>
            <div>
              <label className="label">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                required
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="label">Semester (optional)</label>
            <input value={semester} onChange={(e) => setSemester(e.target.value)} className="input" placeholder="Fall / Spring" />
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="input"
            />
          </div>
          <div>
            <label className="label">PDF file</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
            />
          </div>
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Upload
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
