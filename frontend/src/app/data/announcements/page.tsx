"use client";

import { useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Megaphone,
  RefreshCw,
  Send,
  Trash2,
} from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export default function AnnouncementsPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchAnnouncements = async () => {
    setError("");
    try {
      const res = await fetch("/api/announcements", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      } else {
        const err = await res.json();
        setError(err.error || "Failed to load announcements");
      }
    } catch (err) {
      console.error("Failed to load announcements:", err);
      setError("Could not connect to database server.");
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Both fields are required.");
      return;
    }
    setError("");
    setSuccess("");
    setPublishing(true);

    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to publish announcement");
      }

      setSuccess("Announcement published and vectorized successfully!");
      setTitle("");
      setContent("");
      fetchAnnouncements();
    } catch (err: any) {
      setError(err.message || "Failed to save announcement");
    } finally {
      setPublishing(false);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchAnnouncements();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete announcement");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete announcement");
    }
  };

  return (
    <div className="animate-fade-up">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Announcements</h1>
        <p className="mt-1 text-[13px] text-slate-500">
          Push high-priority context straight into the assistant&apos;s retrieval index
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700">
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-5">
        {/* Compose card */}
        <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-card xl:col-span-2">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Megaphone className="h-[18px] w-[18px]" strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">
                New announcement
              </h2>
              <p className="text-xs text-slate-500">Embedded for top-priority RAG retrieval</p>
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. End Semester Exam Scheduling Update"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10"
            />
          </div>

          <div className="mb-5">
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder="Enter the full context. This will be embedded into the vector DB for top-priority retrieval."
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10"
            />
          </div>

          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {publishing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Vectorizing…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Publish announcement
              </>
            )}
          </button>
        </section>

        {/* Published list */}
        <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card xl:col-span-3">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <p className="text-[15px] font-semibold tracking-tight text-slate-900">Published</p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-slate-500">
                {announcements.length}
              </span>
            </div>
            <button
              type="button"
              onClick={fetchAnnouncements}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>

          {announcements.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                <Megaphone className="h-5 w-5" />
              </span>
              <p className="text-sm font-medium text-slate-600">No announcements yet</p>
              <p className="text-xs text-slate-400">Publish one from the form.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {announcements.map((a) => (
                <li key={a.id} className="px-5 py-4 transition-colors hover:bg-slate-50/70">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-slate-900">{a.title}</p>
                      <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-slate-500">
                        {a.content}
                      </p>
                      <p className="mt-2 text-[11px] font-medium text-slate-400">
                        {new Date(a.created_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteAnnouncement(a.id)}
                      className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      title="Delete announcement"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
