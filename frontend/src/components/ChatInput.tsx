"use client";

import { useState, useRef, useEffect } from 'react';
import { ArrowUp, BookOpen, Briefcase, FileText, Loader2, Mic, Square } from 'lucide-react';

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
  onSendMessage: (text: string, activeTool: string | null) => void;
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
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

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
    if (isRecording || isTranscribing) return;
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

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue, activeTool);
      setInputValue('');
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl shrink-0">
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-input transition-all focus-within:border-brand-300 focus-within:ring-4 focus-within:ring-brand-500/10">
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
            disabled={isLoading || isRecording || isTranscribing}
            placeholder={
              isRecording
                ? 'Listening... Speak now'
                : isTranscribing
                ? 'Transcribing...'
                : activeTool
                ? `${tools.find(t => t.id === activeTool)?.label} mode — ask anything...`
                : 'Ask anything about Manipal...'
            }
            className={`flex-1 bg-transparent py-1.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none disabled:opacity-50 ${
              isRecording ? 'animate-pulse font-medium text-red-500' : ''
            }`}
          />

          {/* Voice Button */}
          <button
            type="button"
            disabled={isLoading || isTranscribing}
            onClick={isRecording ? stopRecording : startRecording}
            className={`relative rounded-xl p-2 transition-all ${
              isRecording
                ? 'animate-pulse cursor-pointer bg-red-500 text-white hover:bg-red-600'
                : isTranscribing
                ? 'cursor-wait text-brand-500'
                : 'cursor-pointer text-slate-400 hover:bg-brand-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50'
            }`}
            title={
              isRecording
                ? 'Stop recording'
                : isTranscribing
                ? 'Transcribing…'
                : 'Start voice input'
            }
          >
            {isTranscribing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isRecording ? (
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
            disabled={!inputValue.trim() || isLoading}
            className={`rounded-xl p-2 transition-all ${
              inputValue.trim() && !isLoading
                ? 'cursor-pointer bg-brand-500 text-white hover:bg-brand-600'
                : 'cursor-default bg-slate-100 text-slate-300'
            }`}
            title="Send message"
          >
            <ArrowUp className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </div>

        {/* Tool chips row */}
        <div className="flex items-center gap-1.5 px-3 pb-3 pt-1">
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
      {micError ? (
        <p className="mt-2 text-center text-[11px] text-red-500" role="alert">
          {micError}
        </p>
      ) : (
        <p className="mt-2 text-center text-[11px] text-slate-400">
          Campus AI can make mistakes. Verify important information.
        </p>
      )}
    </div>
  );
}
