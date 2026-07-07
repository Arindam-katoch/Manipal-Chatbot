"use client";

import { Mic } from "lucide-react";
import { useChat } from "@/context/ChatContext";

/**
 * Distinct, always-visible entry point for the exclusive "Interview Mode" —
 * a Gemini-Live–style voice-to-voice experience (separate from the text chat).
 * Rendered as the flagship action inside the app sidebar.
 */
export default function InterviewModeButton({ collapsed = false }: { collapsed?: boolean }) {
  const { openInterview } = useChat();

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={openInterview}
        title="Interview Studio — live voice practice"
        className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white transition-colors hover:bg-brand-600"
      >
        <Mic className="h-[18px] w-[18px]" strokeWidth={2.2} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openInterview}
      title="Start a live voice interview"
      className="group flex w-full items-center gap-3 rounded-xl bg-brand-500 px-3.5 py-3 text-left transition-colors hover:bg-brand-600"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
        <Mic className="h-4 w-4 text-white" strokeWidth={2.2} />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block text-[13px] font-semibold text-white">Interview Studio</span>
        <span className="block text-[11px] font-medium text-white/70">
          Live voice practice
        </span>
      </span>
    </button>
  );
}
