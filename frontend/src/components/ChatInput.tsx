"use client";

import { useState, useRef, useEffect } from 'react';
import { ArrowUp, BookOpen, Briefcase, FileText, Mic, Paperclip, Square, X } from 'lucide-react';

const MAX_ATTACH_BYTES = 8 * 1024 * 1024; // 8 MB
const ACCEPTED_EXTS = ['pdf', 'txt'];

const tools = [
  {
    id: 'resume',
    label: 'Resume Scanner',
    icon: <FileText className="h-3.5 w-3.5" strokeWidth={2} />,
  },
  {
    id: 'placement',
    label: 'Placement Q&A',
    icon: <Briefcase className="h-3.5 w-3.5" strokeWidth={2} />,
  },
  {
    id: 'study',
    label: 'Study Aid',
    icon: <BookOpen className="h-3.5 w-3.5" strokeWidth={2} />,
  },
];

interface ChatInputProps {
  onSendMessage: (text: string, activeTool: string | null, file?: File | null) => void;
  isLoading: boolean;
}

/**
 * Voice-input WebSocket contract (frontend → backend `/api/audio-stream`)
 * -----------------------------------------------------------------------
 * The backend team (Chaitanya) needs to implement a WebSocket endpoint at
 * `/api/audio-stream` that speaks exactly this protocol:
 *
 *   Client → Server
 *     1. text  : {"event":"start","mimeType":"audio/webm;codecs=opus"}  (sent once, on open)
 *     2. binary: raw audio chunks (the container named in `mimeType`, ~one frame / 250ms)
 *     3. text  : {"event":"stop"}                                       (end-of-stream marker)
 *
 *   Server → Client
 *     - text   : {"event":"transcript","transcript":"<recognised text>"}
 *     - text   : {"event":"done"}                    (optional; server may just close the socket)
 *     - text   : {"event":"error","message":"<reason>"}
 *
 * Concatenating every binary chunk in arrival order reproduces a single valid
 * audio file, so the server can buffer until {"event":"stop"} and transcribe once.
 * Plain-string frames and {"text": "..."} are also accepted for forward-compat.
 */
export default function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachError, setAttachError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const releaseResources = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // already stopped
      }
      recognitionRef.current = null;
    }
  };

  const startRecording = () => {
    if (isRecording) return;
    setMicError(null);

    const SpeechRecognition = typeof window !== 'undefined'
      ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
      : null;

    if (!SpeechRecognition) {
      setMicError('Speech recognition is not supported in this browser. Please use Chrome or Safari.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputValue((prev) => {
            const base = prev.trim();
            return base ? `${base} ${transcript}` : transcript;
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setMicError('Microphone permission denied.');
        } else if (event.error === 'no-speech') {
          // Ignore no-speech warning to avoid UI noise
        } else {
          setMicError(`Speech recognition error: ${event.error}`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setMicError('Failed to start voice input.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Failed to stop speech recognition:', err);
      }
    }
    setIsRecording(false);
  };

  // Release everything if the component unmounts mid-recording.
  useEffect(() => releaseResources, []);

  const handleToolClick = (id: string) => {
    setActiveTool(prev => (prev === id ? null : id));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so selecting the same file again re-triggers onChange.
    e.target.value = '';
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ACCEPTED_EXTS.includes(ext)) {
      setAttachError('Please upload a PDF or .txt resume.');
      return;
    }
    if (file.size > MAX_ATTACH_BYTES) {
      setAttachError('That file is larger than 8 MB.');
      return;
    }

    setAttachError(null);
    setAttachedFile(file);
    // Attaching a resume implies Resume Scanner mode — light up the chip.
    setActiveTool('resume');
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    setAttachError(null);
  };

  const canSend = (inputValue.trim().length > 0 || !!attachedFile) && !isLoading;

  const handleSend = () => {
    if (!canSend) return;
    onSendMessage(inputValue, activeTool, attachedFile);
    setInputValue('');
    setAttachedFile(null);
    setAttachError(null);
  };

  return (
    <div className="mx-auto w-full max-w-3xl shrink-0">
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-input transition-all focus-within:border-brand-300 focus-within:ring-4 focus-within:ring-brand-500/10">
        {/* Attached-file pill */}
        {attachedFile && (
          <div className="flex items-center gap-2 px-4 pt-3">
            <div className="flex max-w-full items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 py-1.5 pl-2.5 pr-1.5">
              <FileText className="h-4 w-4 shrink-0 text-brand-600" strokeWidth={2} />
              <span className="truncate text-xs font-medium text-brand-700">{attachedFile.name}</span>
              <button
                type="button"
                onClick={removeAttachment}
                className="shrink-0 rounded-md p-0.5 text-brand-500 transition-colors hover:bg-brand-100 hover:text-brand-700"
                title="Remove attachment"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Text input row */}
        <div className="flex items-center gap-2 px-4 pb-2 pt-3.5">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSend();
              }
            }}
            disabled={isLoading || isRecording}
            placeholder={
              isRecording
                ? 'Listening... Speak now'
                : attachedFile
                ? 'Add a note or target role (optional), then send…'
                : activeTool === 'resume'
                ? 'Attach your resume (PDF) for an ATS review…'
                : activeTool
                ? `${tools.find(t => t.id === activeTool)?.label} mode — ask anything...`
                : 'Ask anything about Manipal...'
            }
            className={`flex-1 bg-transparent py-1.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none disabled:opacity-50 ${
              isRecording ? 'animate-pulse font-medium text-red-500' : ''
            }`}
          />

          {/* Attach Button */}
          <button
            type="button"
            disabled={isLoading || isRecording}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl p-2 text-slate-400 transition-all hover:bg-brand-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            title="Attach a resume (PDF)"
          >
            <Paperclip className="h-4 w-4" strokeWidth={2} />
          </button>

          {/* Voice Button */}
          <button
            type="button"
            disabled={isLoading}
            onClick={isRecording ? stopRecording : startRecording}
            className={`relative rounded-xl p-2 transition-all ${
              isRecording
                ? 'animate-pulse cursor-pointer bg-red-500 text-white hover:bg-red-600'
                : 'cursor-pointer text-slate-400 hover:bg-brand-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50'
            }`}
            title={
              isRecording
                ? 'Stop recording'
                : 'Start voice input'
            }
          >
            {isRecording ? (
              <Square className="h-4 w-4" fill="currentColor" />
            ) : (
              <Mic className="h-4 w-4" strokeWidth={2} />
            )}
            {isRecording && (
              <span className="absolute inset-0 -z-10 animate-ping rounded-xl bg-red-500 opacity-75" />
            )}
          </button>

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className={`rounded-xl p-2 transition-all ${
              canSend
                ? 'cursor-pointer bg-brand-500 text-white hover:bg-brand-600'
                : 'cursor-default bg-slate-100 text-slate-300'
            }`}
            title="Send message"
          >
            <ArrowUp className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </div>

        {/* Tool chips row */}
        <div className="flex flex-wrap items-center gap-1.5 px-3 pb-3 pt-1">
          {tools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              disabled={isLoading}
              onClick={() => handleToolClick(tool.id)}
              className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                activeTool === tool.id
                  ? 'border-brand-200 bg-brand-50 text-brand-700'
                  : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600'
              }`}
            >
              {tool.icon}
              {tool.label}
            </button>
          ))}
        </div>
      </div>
      {micError || attachError ? (
        <p className="mt-2 text-center text-[11px] text-red-500" role="alert">
          {micError || attachError}
        </p>
      ) : (
        <p className="mt-2 text-center text-[11px] text-slate-400">
          Campus AI can make mistakes. Verify important information.
        </p>
      )}
    </div>
  );
}
