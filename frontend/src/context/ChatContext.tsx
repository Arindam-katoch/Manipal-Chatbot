"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  activeTool: string | null;
  createdAt: string;
}

interface ChatContextType {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isLoading: boolean;
  createSession: () => string;
  deleteSession: (id: string) => void;
  sendMessage: (text: string, activeTool: string | null) => Promise<void>;
  setActiveSessionId: (id: string | null) => void;
  activeSession: ChatSession | null;
  isInterviewOpen: boolean;
  openInterview: () => void;
  closeInterview: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInterviewOpen, setIsInterviewOpen] = useState(false);

  const openInterview = () => setIsInterviewOpen(true);
  const closeInterview = () => setIsInterviewOpen(false);

  // Load sessions from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('manipal_chat_sessions');
      if (stored) {
        const parsed = JSON.parse(stored) as ChatSession[];
        setSessions(parsed);
        if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
        }
      } else {
        // Create an initial session if none exist
        const initialSession: ChatSession = {
          id: 'initial-session-id',
          title: 'New Chat',
          messages: [],
          activeTool: null,
          createdAt: new Date().toISOString()
        };
        setSessions([initialSession]);
        setActiveSessionId(initialSession.id);
      }
    } catch (e) {
      console.error('Failed to load chat sessions:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save sessions to localStorage when they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('manipal_chat_sessions', JSON.stringify(sessions));
      } catch (e) {
        console.error('Failed to save chat sessions:', e);
      }
    }
  }, [sessions, isLoaded]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  const createSession = () => {
    // If a chat with no messages already exists, don't spawn another empty one —
    // reuse it (prefer the active chat when it's already empty).
    const emptySession =
      sessions.find(s => s.id === activeSessionId && s.messages.length === 0) ??
      sessions.find(s => s.messages.length === 0);
    if (emptySession) {
      setActiveSessionId(emptySession.id);
      return emptySession.id;
    }

    const newId = Math.random().toString(36).substring(2, 11);
    const newSession: ChatSession = {
      id: newId,
      title: 'New Chat',
      messages: [],
      activeTool: null,
      createdAt: new Date().toISOString()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    return newId;
  };

  const deleteSession = (id: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      // If we deleted the active session, switch to another one
      if (activeSessionId === id) {
        if (filtered.length > 0) {
          setActiveSessionId(filtered[0].id);
        } else {
          // If no sessions remain, create a new one
          const newSession: ChatSession = {
            id: 'fallback-session-id',
            title: 'New Chat',
            messages: [],
            activeTool: null,
            createdAt: new Date().toISOString()
          };
          setActiveSessionId(newSession.id);
          return [newSession];
        }
      }
      return filtered;
    });
  };

  const sendMessage = async (text: string, activeTool: string | null) => {
    if (!activeSessionId) return;

    // Conversation history for the RAG route (real turns only, capped to keep
    // the prompt small — retrieval always uses the latest user message).
    const history = (activeSession?.messages || [])
      .filter(m => !m.isError)
      .slice(-12)
      .map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

    const userMessage: Message = {
      id: Math.random().toString(36).substring(2, 11),
      sender: 'user',
      text,
      timestamp: new Date().toISOString()
    };

    // Update session messages and set tool
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        const isFirstMessage = s.messages.length === 0;
        const newTitle = isFirstMessage 
          ? (text.length > 25 ? text.substring(0, 25) + '...' : text) 
          : s.title;

        return {
          ...s,
          title: newTitle,
          activeTool,
          messages: [...s.messages, userMessage]
        };
      }
      return s;
    }));

    setIsLoading(true);

    try {
      // Local RAG route: embeds the query, retrieves matching knowledge-base
      // chunks + announcements from Supabase pgvector, then streams the answer.
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...history, { role: 'user', content: text }],
          tool: activeTool
        })
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      // Stream the answer into a single AI message, created on the first chunk
      // so the typing indicator covers retrieval + time-to-first-token.
      const aiMessageId = Math.random().toString(36).substring(2, 11);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;

        const isFirstChunk = aiText === '';
        aiText += chunk;
        const currentText = aiText;

        setSessions(prev => prev.map(s => {
          if (s.id !== activeSessionId) return s;
          if (isFirstChunk) {
            return {
              ...s,
              messages: [...s.messages, {
                id: aiMessageId,
                sender: 'ai' as const,
                text: currentText,
                timestamp: new Date().toISOString()
              }]
            };
          }
          return {
            ...s,
            messages: s.messages.map(m => (m.id === aiMessageId ? { ...m, text: currentText } : m))
          };
        }));
        if (isFirstChunk) setIsLoading(false);
      }

      if (!aiText.trim()) {
        throw new Error('Empty response from chat API');
      }

    } catch (error) {
      console.warn('API call failed, generating smart fallback response:', error);
      
      // Smart fallback response
      let fallbackText = '';
      if (activeTool === 'resume') {
        fallbackText = "📄 **Resume Scanner (Offline Mode)**\n\nCurrently offline, but here is standard resume feedback for MIT students:\n- Use standard sections: Education, Experience, Projects, Skills.\n- Avoid rating bars for skills; list them cleanly.\n- Keep it in PDF format.";
      } else if (activeTool === 'interview') {
        fallbackText = "🎙️ **Interview Mode (Offline Mode)**\n\nLet's practice behavioral questions. Question: *\"Tell me about a time you worked in a team and faced a conflict. How did you resolve it?\"*";
      } else {
        fallbackText = `🤖 **Campus Assistant (Offline Mode)**\n\nI received your query: "${text}".\n\n*Note: The backend API is currently unreachable, but I am here in offline fallback mode to assist you.*`;
      }

      const aiMessage: Message = {
        id: Math.random().toString(36).substring(2, 11),
        sender: 'ai',
        text: fallbackText,
        timestamp: new Date().toISOString(),
        isError: true
      };

      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: [...s.messages, aiMessage]
          };
        }
        return s;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        sessions,
        activeSessionId,
        isLoading,
        createSession,
        deleteSession,
        sendMessage,
        setActiveSessionId,
        activeSession,
        isInterviewOpen,
        openInterview,
        closeInterview
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
