'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Eye, 
  UploadCloud, 
  Megaphone, 
  Database, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  FileSpreadsheet,
  File,
  Sparkles
} from 'lucide-react';

interface DocumentItem {
  id: string;
  title: string;
  file_type: string;
  upload_timestamp: string;
  chunks_count: number;
}

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface ChunkItem {
  id: string;
  content: string;
  chunk_index: number;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'kb' | 'announcements'>('kb');
  
  // Knowledge Base States
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isDocsLoading, setIsDocsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chunk Preview Modal States
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [previewChunks, setPreviewChunks] = useState<ChunkItem[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Announcements States
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [isAnnLoading, setIsAnnLoading] = useState(true);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [isSubmittingAnn, setIsSubmittingAnn] = useState(false);
  const [annSuccessMessage, setAnnSuccessMessage] = useState<string | null>(null);
  const [annErrorMessage, setAnnErrorMessage] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetchDocuments();
    fetchAnnouncements();
  }, []);

  const fetchDocuments = async () => {
    setIsDocsLoading(true);
    try {
      const res = await fetch('/api/documents', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setIsDocsLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    setIsAnnLoading(true);
    try {
      const res = await fetch('/api/announcements', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setIsAnnLoading(false);
    }
  };

  // Document Upload handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate progress increments for UI delight
      const interval = setInterval(() => {
        setUploadProgress(prev => (prev < 80 ? prev + 15 : prev));
      }, 300);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(interval);
      setUploadProgress(100);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Upload failed');
      }

      setUploadSuccess(true);
      fetchDocuments();
      setTimeout(() => {
        setUploadSuccess(false);
        setUploadProgress(0);
      }, 3000);
    } catch (err: any) {
      setUploadError(err.message || 'An error occurred during file ingestion');
    } finally {
      setIsUploading(false);
    }
  };

  // Delete Document
  const handleDeleteDoc = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document and all its vector chunks?')) return;
    
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== id));
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete document');
    }
  };

  // Preview Chunks Modal
  const handleOpenPreview = async (doc: DocumentItem) => {
    setPreviewDoc(doc);
    setPreviewChunks([]);
    setPreviewIndex(0);
    setIsPreviewLoading(true);

    try {
      const res = await fetch(`/api/documents/${doc.id}`);
      if (res.ok) {
        const data = await res.json();
        setPreviewChunks(data.chunks);
      } else {
        console.error('Failed to load chunks');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    setPreviewDoc(null);
    setPreviewChunks([]);
    setPreviewIndex(0);
  };

  // Announcement handlers
  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    setIsSubmittingAnn(true);
    setAnnSuccessMessage(null);
    setAnnErrorMessage(null);

    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: annTitle,
          content: annContent,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit announcement');
      }

      setAnnTitle('');
      setAnnContent('');
      setAnnSuccessMessage('Announcement posted and vectorized successfully!');
      fetchAnnouncements();
    } catch (err: any) {
      setAnnErrorMessage(err.message || 'An error occurred while saving the announcement');
    } finally {
      setIsSubmittingAnn(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (type.includes('xlsx') || type.includes('xls') || type.includes('sheet')) {
      return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
    }
    return <File className="w-5 h-5 text-blue-500" />;
  };

  return (
    <div className="flex w-full h-full bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-orange-600/20 text-orange-500">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-white">Campus AI</h2>
            <p className="text-[11px] text-slate-400 font-medium">Control Center</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1.5">
          <button
            onClick={() => setActiveTab('kb')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'kb'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
            }`}
          >
            <Database className="w-4 h-4" />
            Knowledge Base
          </button>
          
          <button
            onClick={() => setActiveTab('announcements')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'announcements'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            Announcements Board
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 text-center font-medium">
          System operational &bull; pgvector
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-slate-900">
        <header className="h-16 border-b border-slate-800 px-8 flex items-center justify-between shrink-0 bg-slate-950/40 backdrop-blur-sm z-10 sticky top-0">
          <h1 className="text-lg font-semibold text-white">
            {activeTab === 'kb' ? 'RAG Document Management' : 'Vectorized Announcements Board'}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium">
              Gemini Text Embeddings (3072d)
            </span>
          </div>
        </header>

        <div className="p-8 max-w-6xl w-full mx-auto space-y-8 flex-1">
          {/* TAB 1: Knowledge Base */}
          {activeTab === 'kb' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Left Column: Upload Area */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
                    {isUploading && (
                      <div 
                        className="h-full bg-orange-600 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-orange-500" />
                    Ingest Content
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6 font-light">
                    Upload documents to split into semantic chunks and generate vector embeddings. Supports PDF, Excel (.xlsx/.xls), and TXT files.
                  </p>

                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                      isUploading
                        ? 'border-orange-500/50 bg-orange-600/5 pointer-events-none'
                        : 'border-slate-800 hover:border-orange-500/40 hover:bg-slate-900/50'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,.xlsx,.xls,.txt"
                      className="hidden"
                    />
                    
                    {isUploading ? (
                      <div className="flex flex-col items-center text-center">
                        <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-3" />
                        <p className="text-xs font-semibold text-white">Ingesting chunks...</p>
                        <p className="text-[10px] text-slate-400 mt-1">{uploadProgress}% complete</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center">
                        <UploadCloud className="w-10 h-10 text-slate-500 mb-3" />
                        <p className="text-xs font-medium text-slate-200">Drag & drop your file here</p>
                        <p className="text-[10px] text-slate-500 mt-1.5">or click to browse local files</p>
                      </div>
                    )}
                  </div>

                  {/* Feedback notices */}
                  {uploadSuccess && (
                    <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg flex items-center gap-2.5 text-xs font-medium">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      Document successfully ingested!
                    </div>
                  )}

                  {uploadError && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-start gap-2.5 text-xs font-medium leading-relaxed">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block">Ingestion Failed</span>
                        <span className="text-[11px] text-red-300/80">{uploadError}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Documents Table */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-sm font-semibold text-white mb-6 flex items-center gap-2">
                    <Database className="w-4 h-4 text-orange-500" />
                    Ingested Documents ({documents.length})
                  </h3>

                  {isDocsLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                      <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-2.5" />
                      <span className="text-xs font-medium">Loading documents list...</span>
                    </div>
                  ) : documents.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-slate-800 rounded-xl">
                      <File className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                      <p className="text-sm font-medium text-slate-400">No documents found</p>
                      <p className="text-xs text-slate-500 mt-1 font-light">Ingest a file to populate your RAG knowledge base.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                            <th className="pb-3 pl-2">Name</th>
                            <th className="pb-3 text-center">Chunks</th>
                            <th className="pb-3">Uploaded</th>
                            <th className="pb-3 text-right pr-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 text-xs">
                          {documents.map(doc => (
                            <tr key={doc.id} className="hover:bg-slate-900/40 transition-colors group">
                              <td className="py-4 pl-2 font-medium text-slate-200 flex items-center gap-3 max-w-xs truncate">
                                {getFileIcon(doc.file_type)}
                                <span className="truncate" title={doc.title}>{doc.title}</span>
                              </td>
                              <td className="py-4 text-center font-semibold text-slate-300">
                                <span className="px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-[10px]">
                                  {doc.chunks_count}
                                </span>
                              </td>
                              <td className="py-4 text-slate-400 font-light">
                                {new Date(doc.upload_timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td className="py-4 text-right pr-2">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleOpenPreview(doc)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                                    title="Preview semantic chunks"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDoc(doc.id)}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                    title="Delete document"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Announcements */}
          {activeTab === 'announcements' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Left Column: Form */}
              <div className="lg:col-span-1 space-y-6">
                <form onSubmit={handleAddAnnouncement} className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-orange-500" />
                    New Announcement
                  </h3>
                  
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">Announcement Title</label>
                    <input
                      type="text"
                      placeholder="e.g., Semester Exams Update"
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">Content Description</label>
                    <textarea
                      placeholder="Enter details of the announcement..."
                      rows={5}
                      value={annContent}
                      onChange={(e) => setAnnContent(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 transition-all outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingAnn}
                    className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-orange-800/40 text-white rounded-xl py-2.5 text-xs font-semibold shadow-lg shadow-orange-600/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {isSubmittingAnn ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Vectorizing...
                      </>
                    ) : (
                      <>
                        <Megaphone className="w-3.5 h-3.5" />
                        Publish & Vectorize
                      </>
                    )}
                  </button>

                  {/* Feedbacks */}
                  {annSuccessMessage && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg flex items-center gap-2.5 text-xs font-medium">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      {annSuccessMessage}
                    </div>
                  )}

                  {annErrorMessage && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center gap-2.5 text-xs font-medium">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {annErrorMessage}
                    </div>
                  )}
                </form>
              </div>

              {/* Right Column: Board */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-sm font-semibold text-white mb-6 flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-orange-500" />
                    Announcements Feed ({announcements.length})
                  </h3>

                  {isAnnLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                      <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-2.5" />
                      <span className="text-xs font-medium">Loading announcements board...</span>
                    </div>
                  ) : announcements.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-slate-800 rounded-xl">
                      <Megaphone className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                      <p className="text-sm font-medium text-slate-400">No announcements posted</p>
                      <p className="text-xs text-slate-500 mt-1 font-light">Add an announcement to supply priority vectorized context.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {announcements.map(ann => (
                        <div 
                          key={ann.id} 
                          className="p-5 border border-slate-800/80 bg-slate-900/20 rounded-xl relative hover:border-slate-700 transition-all"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-white">{ann.title}</h4>
                            <span className="text-[10px] text-slate-500 font-light">
                              {new Date(ann.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 font-light leading-relaxed whitespace-pre-wrap">
                            {ann.content}
                          </p>
                          <div className="mt-3.5 pt-3.5 border-t border-slate-800/60 flex items-center justify-between">
                            <span className="text-[9px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                              Indexed in pgvector
                            </span>
                            <span className="text-[10px] text-slate-500 font-light">
                              ID: {ann.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* CHUNK PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <header className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div>
                <h3 className="text-sm font-semibold text-white">Semantic Chunks Preview</h3>
                <p className="text-[10px] text-slate-400 truncate max-w-md mt-0.5">{previewDoc.title}</p>
              </div>
              <button
                onClick={handleClosePreview}
                className="text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-xs transition-all cursor-pointer font-medium"
              >
                Close
              </button>
            </header>

            <div className="flex-1 p-6 overflow-y-auto min-h-[250px] flex flex-col justify-between">
              {isPreviewLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 my-auto">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-2.5" />
                  <span className="text-xs font-medium">Loading document chunks...</span>
                </div>
              ) : previewChunks.length === 0 ? (
                <div className="text-center py-20 text-slate-500 my-auto">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <span className="text-xs font-medium">No chunks found for this document</span>
                </div>
              ) : (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 font-mono text-xs leading-relaxed text-slate-300 whitespace-pre-wrap max-h-[350px] overflow-y-auto">
                    {previewChunks[previewIndex]?.content}
                  </div>

                  <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                        Chunk {previewIndex + 1} of {previewChunks.length}
                      </span>
                      <span className="text-[9px] text-slate-500">
                        &bull; {previewChunks[previewIndex]?.content.length} chars
                      </span>
                    </div>

                    {/* Dot indicators */}
                    <div className="hidden sm:flex items-center gap-1 max-w-[150px] overflow-x-auto px-2">
                      {previewChunks.map((_, idx) => (
                        <span 
                          key={idx}
                          className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all ${
                            idx === previewIndex ? 'bg-orange-500 scale-125' : 'bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewIndex(prev => Math.max(0, prev - 1))}
                        disabled={previewIndex === 0}
                        className="p-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPreviewIndex(prev => Math.min(previewChunks.length - 1, prev + 1))}
                        disabled={previewIndex === previewChunks.length - 1}
                        className="p-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
