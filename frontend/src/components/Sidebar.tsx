"use client";

import { useState } from "react";
import { MessageSquare, PanelLeftClose, PanelLeftOpen, Plus, Trash2 } from "lucide-react";
import { useChat } from "@/context/ChatContext";

/** Contextual panel for the AI Assistant — conversation history. */
export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const { sessions, activeSessionId, createSession, deleteSession, setActiveSessionId } = useChat();

  return (
    <aside
      className={`relative z-10 hidden h-full shrink-0 flex-col border-r border-slate-200/80 bg-white transition-[width] duration-300 ease-in-out lg:flex ${
        isOpen ? "w-[272px]" : "w-[64px]"
      }`}
    >
      {/* Panel header */}
      <div
        className={`flex h-[52px] shrink-0 items-center border-b border-slate-100 ${
          isOpen ? "justify-between px-4" : "justify-center"
        }`}
      >
        {isOpen && (
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-semibold tracking-tight text-slate-900">
              Conversations
            </p>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              {sessions.length}
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          title={isOpen ? "Collapse panel" : "Expand panel"}
        >
          {isOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* New chat */}
      <div className={`shrink-0 ${isOpen ? "p-3" : "px-3 py-3"}`}>
        {isOpen ? (
          <button
            type="button"
            onClick={() => createSession()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink-950 py-2.5 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-ink-900"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            New conversation
          </button>
        ) : (
          <button
            type="button"
            onClick={() => createSession()}
            className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-ink-950 text-white shadow-sm transition-colors hover:bg-ink-900"
            title="New conversation"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* History */}
      <div className="scroll-slim flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
        {isOpen && (
          <p className="mb-1.5 px-3 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Recent
          </p>
        )}

        {sessions.map((session) => {
          const isActive = session.id === activeSessionId;
          return (
            <div
              key={session.id}
              onClick={() => setActiveSessionId(session.id)}
              title={!isOpen ? session.title || "New Chat" : undefined}
              className={`group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-[13px] transition-colors ${
                isOpen ? "" : "justify-center px-0 py-2.5"
              } ${
                isActive
                  ? "bg-brand-50 font-medium text-slate-900 ring-1 ring-inset ring-brand-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className={`flex w-full items-center gap-2.5 overflow-hidden ${isOpen ? "" : "justify-center"}`}>
                <MessageSquare
                  className={`h-[15px] w-[15px] shrink-0 ${
                    isActive ? "text-brand-500" : "text-slate-400"
                  }`}
                  strokeWidth={2}
                />
                {isOpen && (
                  <span className="w-full select-none truncate pr-1 text-left">
                    {session.title || "New Chat"}
                  </span>
                )}
              </div>

              {isOpen && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                  className="shrink-0 rounded-md p-1 text-slate-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  title="Delete conversation"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
