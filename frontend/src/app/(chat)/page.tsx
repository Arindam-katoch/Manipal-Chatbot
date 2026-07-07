"use client";

import { useRef, useEffect } from "react";
import {
  CalendarDays,
  CalendarClock,
  FileSearch,
  FileText,
  Mic,
  Sparkles,
} from "lucide-react";
import ChatInput from "@/components/ChatInput";
import { useChat } from "@/context/ChatContext";
import MarkdownRenderer from "@/components/MarkdownRenderer";

const SUGGESTIONS = [
  {
    icon: FileText,
    title: "Resume ATS review",
    description: "Score your resume against recruiter filters",
    prompt: "Help with Resume ATS",
  },
  {
    icon: Mic,
    title: "Behavioral practice",
    description: "Rehearse the questions HR actually asks",
    prompt: "Practice Behavioral Interview",
  },
  {
    icon: FileSearch,
    title: "Company question bank",
    description: "Real questions from past placement drives",
    prompt: "Company question bank",
  },
  {
    icon: CalendarDays,
    title: "Upcoming placements",
    description: "See which companies are visiting next",
    prompt: "Upcoming placements",
  },
];

export default function Home() {
  const { activeSession, isLoading, sendMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = activeSession?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = (text: string, activeTool: string | null) => {
    sendMessage(text, activeTool);
  };

  return (
    <main className="relative flex h-full flex-1 flex-col overflow-hidden bg-slate-50">
      {/* Messages area */}
      <div className="scroll-slim flex flex-1 flex-col overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
        {messages.length === 0 ? (
          /* ── Welcome view ─────────────────────────────────────────── */
          <div className="relative z-10 mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center animate-fade-up">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500">
              <Sparkles className="h-7 w-7 text-white" strokeWidth={2} />
            </div>
            <h1 className="mb-2 text-center text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              How can I help you today?
            </h1>
            <p className="mb-8 max-w-md text-center text-sm leading-relaxed text-slate-500">
              Your intelligent guide for MIT Bengaluru — placements, resumes,
              interview prep, and everything on campus.
            </p>

            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.title}
                    type="button"
                    onClick={() => handleSendMessage(s.prompt, activeSession?.activeTool || null)}
                    className="group flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100">
                      <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold tracking-tight text-slate-900">
                        {s.title}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                        {s.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => handleSendMessage("Check my schedule", activeSession?.activeTool || null)}
              className="mt-4 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow-card transition-all hover:border-brand-200 hover:text-brand-600"
            >
              <CalendarClock className="h-3.5 w-3.5" />
              Check my schedule
            </button>
          </div>
        ) : (
          /* ── Chat history ─────────────────────────────────────────── */
          <div className="mx-auto flex w-full max-w-3xl flex-col space-y-5 pb-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex max-w-[90%] flex-col animate-fade-up sm:max-w-[82%] ${
                  m.sender === "user" ? "items-end self-end" : "items-start self-start"
                }`}
              >
                {/* Sender row */}
                <div className="mb-1.5 flex items-center gap-2 px-1">
                  {m.sender !== "user" && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-500">
                      <Sparkles className="h-3 w-3 text-white" strokeWidth={2.2} />
                    </span>
                  )}
                  <span className="text-[11px] font-semibold text-slate-500">
                    {m.sender === "user" ? "You" : "Campus AI"}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400">
                    {new Date(m.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Message bubble */}
                <div
                  className={`px-4 py-3 ${
                    m.sender === "user"
                      ? "rounded-2xl rounded-br-md bg-brand-500 text-white shadow-card"
                      : m.isError
                      ? "rounded-2xl rounded-tl-md border border-red-200 bg-red-50 text-red-800 shadow-card"
                      : "rounded-2xl rounded-tl-md border border-slate-200/80 bg-white text-slate-800 shadow-card"
                  }`}
                >
                  {m.sender === "user" ? (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.text}</p>
                  ) : (
                    <MarkdownRenderer content={m.text} />
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex max-w-[82%] flex-col items-start self-start">
                <div className="mb-1.5 flex items-center gap-2 px-1">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-500">
                    <Sparkles className="h-3 w-3 text-white" strokeWidth={2.2} />
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">Campus AI</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-slate-200/80 bg-white px-4 py-3.5 shadow-card">
                  <span
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div
        className="relative z-10 flex w-full justify-center px-3 pt-1 sm:px-6"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </main>
  );
}
