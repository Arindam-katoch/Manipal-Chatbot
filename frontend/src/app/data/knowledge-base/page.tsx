"use client";

import { useCallback, useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Loader2,
  RefreshCw,
  Trash2,
  UploadCloud,
} from "lucide-react";

interface IngestedDoc {
  id: string;
  title: string;
  file_type: string;
  chunks_count: number;
  upload_timestamp: string;
}

const getCleanFileType = (fileType: string) => {
  if (!fileType) return "UNKNOWN";
  const lowered = fileType.toLowerCase();
  if (lowered.includes("pdf")) return "PDF";
  if (lowered.includes("sheet") || lowered.includes("excel") || lowered.includes("xlsx") || lowered === "xls") return "XLSX";
  if (lowered.includes("text") || lowered.includes("txt")) return "TXT";
  if (lowered.includes("/")) {
    return fileType.split("/").pop()?.toUpperCase() || fileType.toUpperCase();
  }
  return fileType.toUpperCase();
};

export default function KnowledgeBasePage() {
  const [isDragging, setIsDragging] = useState(false);
  const [docs, setDocs] = useState<IngestedDoc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/documents", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setDocs(data);
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setUploading(true);
    setError("");
    setSuccess("");

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || `Failed to upload ${file.name}`);
        }
      }

      setSuccess("All documents uploaded and vectorized successfully!");
      fetchDocuments();
    } catch (err: any) {
      setError(err.message || "An error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  const deleteDoc = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document and all its chunks?")) return;
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchDocuments();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete document");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete document");
    }
  };

  return (
    <div className="animate-fade-up">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Knowledge base</h1>
        <p className="mt-1 text-[13px] text-slate-500">
          Documents ingested into the assistant&apos;s retrieval index
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

      {/* Drop zone card */}
      <div className="mb-5 rounded-xl border border-slate-200/80 bg-white p-4 shadow-card">
        <label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-12 transition-all ${
            isDragging
              ? "border-brand-400 bg-brand-50"
              : "border-slate-300 hover:border-brand-400 hover:bg-brand-50/40"
          }`}
        >
          <input
            type="file"
            multiple
            accept=".pdf,.xlsx,.txt"
            className="hidden"
            onChange={handleFileInput}
          />
          {uploading ? (
            <>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
                <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
              </span>
              <p className="text-sm font-semibold text-brand-600">Ingesting documents…</p>
              <p className="text-xs text-slate-400">Parsing, chunking, and vectorizing</p>
            </>
          ) : (
            <>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
                <UploadCloud className="h-6 w-6 text-brand-500" strokeWidth={1.8} />
              </span>
              <p className="text-sm font-semibold text-slate-800">
                Drag &amp; drop files here, or click to browse
              </p>
              <p className="text-xs text-slate-400">Supports .pdf, .xlsx, and .txt</p>
            </>
          )}
        </label>
      </div>

      {/* Ingested documents table */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <p className="text-[15px] font-semibold tracking-tight text-slate-900">
              Ingested documents
            </p>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-slate-500">
              {docs.length}
            </span>
          </div>
          <button
            type="button"
            onClick={fetchDocuments}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[2fr_100px_80px_170px_80px] gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          <span>Document</span>
          <span>Type</span>
          <span className="text-right">Chunks</span>
          <span>Ingested</span>
          <span className="text-right">Actions</span>
        </div>

        {docs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
              <FileText className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium text-slate-600">No documents ingested yet</p>
            <p className="text-xs text-slate-400">Upload a file above to get started.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {docs.map((doc) => (
              <li
                key={doc.id}
                className="grid grid-cols-[2fr_100px_80px_170px_80px] items-center gap-4 px-5 py-3 text-sm transition-colors hover:bg-slate-50/70"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate text-[13px] font-medium text-slate-800" title={doc.title}>
                    {doc.title}
                  </span>
                </span>
                <span>
                  <span className="inline-flex rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700 ring-1 ring-inset ring-brand-200/70">
                    {getCleanFileType(doc.file_type)}
                  </span>
                </span>
                <span className="text-right text-[13px] tabular-nums text-slate-600">
                  {doc.chunks_count}
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(doc.upload_timestamp).toLocaleString()}
                </span>
                <span className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => deleteDoc(doc.id)}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    title="Delete document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
