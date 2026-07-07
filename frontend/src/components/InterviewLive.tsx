"use client";

import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff, X } from 'lucide-react';
import type Vapi from '@vapi-ai/web';

/**
 * Gemini-Live–style mock interview, powered by the Vapi Web SDK.
 *
 * Flow: open → SETUP (pick interview parameters) → START → live voice↔voice call.
 * Vapi runs the full real-time loop (STT + LLM + TTS over WebRTC); this component
 * collects the candidate's preferences, passes them to the assistant as
 * `assistantOverrides.variableValues` (available as {{key}} inside the Vapi
 * assistant prompt), and renders an immersive overlay driven by Vapi events.
 *
 * Configure via Vercel/`.env`:
 *   NEXT_PUBLIC_VAPI_PUBLIC_KEY    – Vapi public (web) key
 *   NEXT_PUBLIC_VAPI_ASSISTANT_ID  – the interviewer assistant to dial
 */

type Phase = 'connecting' | 'listening' | 'speaking' | 'ended' | 'error';
type Turn = { role: 'user' | 'assistant'; content: string };

interface InterviewConfig {
  type: string;
  role: string;
  field: string;
  experience: string;
  difficulty: string;
  focus: string;
  company: string;
}

interface InterviewLiveProps {
  open: boolean;
  onClose: () => void;
}

interface VapiMessage {
  type?: string;
  role?: 'user' | 'assistant' | string;
  transcript?: string;
  transcriptType?: 'partial' | 'final' | string;
}

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
const ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

const INTERVIEW_TYPES = ['Technical', 'Behavioral', 'HR / General', 'System Design', 'Case Study', 'Mixed'];
const FIELDS = ['Software Engineering', 'Data Science / ML', 'Product Management', 'Electronics / ECE', 'Mechanical', 'Finance', 'Consulting', 'Other'];
const EXPERIENCE_LEVELS = ['Final-year student / Fresher', 'Internship level', '0–2 years', '2–5 years', '5+ years'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const DEFAULT_CONFIG: InterviewConfig = {
  type: 'Technical',
  role: '',
  field: 'Software Engineering',
  experience: 'Final-year student / Fresher',
  difficulty: 'Medium',
  focus: '',
  company: '',
};

const PHASE_LABEL: Record<Phase, string> = {
  connecting: 'Connecting…',
  listening: 'Listening…',
  speaking: 'Interviewer speaking…',
  ended: 'Interview ended',
  error: 'Connection error',
};

/* Shared dark backdrop — same ink family as the app sidebar */
const OVERLAY_BG = '#0A0D18';

function buildFirstMessage(cfg: InterviewConfig): string {
  const at = cfg.company.trim() ? ` for a role at ${cfg.company.trim()}` : '';
  return (
    `Hello! I'll be your interviewer today for a ${cfg.difficulty.toLowerCase()} ${cfg.type} interview ` +
    `for the ${cfg.role.trim() || 'candidate'} position in ${cfg.field}${at}. ` +
    `Let's begin — could you start by telling me a little about yourself?`
  );
}

export default function InterviewLive({ open, onClose }: InterviewLiveProps) {
  const [started, setStarted] = useState(false);
  const [config, setConfig] = useState<InterviewConfig>(DEFAULT_CONFIG);

  const [phase, setPhase] = useState<Phase>('connecting');
  const [transcript, setTranscript] = useState<Turn[]>([]);
  const [partialUser, setPartialUser] = useState('');
  const [partialAssistant, setPartialAssistant] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);

  const vapiRef = useRef<Vapi | null>(null);
  const orbRef = useRef<HTMLDivElement | null>(null);
  const configRef = useRef<InterviewConfig>(config);

  const setOrbLevel = (scale: number) => orbRef.current?.style.setProperty('--iv-level', String(scale));

  // Reset back to the setup form whenever the overlay is closed (deferred so no
  // setState runs synchronously inside the effect body).
  useEffect(() => {
    if (open) return;
    const id = setTimeout(() => setStarted(false), 0);
    return () => clearTimeout(id);
  }, [open]);

  // Live Vapi session — only runs once the user has started the interview.
  useEffect(() => {
    if (!open || !started) return;
    let cancelled = false;

    const run = async () => {
      if (!PUBLIC_KEY || !ASSISTANT_ID) {
        setErrorMsg('Voice service is not configured. Set NEXT_PUBLIC_VAPI_PUBLIC_KEY and NEXT_PUBLIC_VAPI_ASSISTANT_ID.');
        setPhase('error');
        return;
      }

      setPhase('connecting');
      setErrorMsg(null);
      setTranscript([]);
      setPartialUser('');
      setPartialAssistant('');
      setMuted(false);

      let VapiCtor: typeof Vapi;
      try {
        VapiCtor = (await import('@vapi-ai/web')).default;
      } catch (err) {
        console.error('Failed to load Vapi SDK:', err);
        if (!cancelled) { setErrorMsg('Could not load the voice SDK.'); setPhase('error'); }
        return;
      }
      if (cancelled) return;

      const vapi = new VapiCtor(PUBLIC_KEY);
      vapiRef.current = vapi;

      vapi.on('call-start', () => setPhase('listening'));
      vapi.on('call-end', () => { setOrbLevel(1); setPhase('ended'); });
      vapi.on('speech-start', () => setPhase('speaking'));
      vapi.on('speech-end', () => { setOrbLevel(1); setPhase((p) => (p === 'ended' || p === 'error' ? p : 'listening')); });
      vapi.on('volume-level', (volume: number) => setOrbLevel(1 + Math.min(volume * 1.4, 1.05)));
      vapi.on('error', (err: unknown) => {
        console.error('Vapi error:', err);
        const message = (err as { errorMsg?: string; message?: string })?.errorMsg
          ?? (err as { message?: string })?.message;
        setErrorMsg(typeof message === 'string' ? message : 'Voice connection error.');
        setPhase('error');
      });
      vapi.on('message', (message: VapiMessage) => {
        if (message?.type !== 'transcript' || typeof message.transcript !== 'string') return;
        const role: Turn['role'] = message.role === 'user' ? 'user' : 'assistant';
        const text = message.transcript;
        if (message.transcriptType === 'final') {
          setTranscript((prev) => [...prev, { role, content: text }]);
          if (role === 'user') setPartialUser(''); else setPartialAssistant('');
        } else if (role === 'user') {
          setPartialUser(text);
        } else {
          setPartialAssistant(text);
        }
      });

      // Pass the candidate's chosen parameters to the interviewer assistant.
      const cfg = configRef.current;
      const overrides: Parameters<typeof vapi.start>[1] = {
        variableValues: {
          interviewType: cfg.type,
          role: cfg.role.trim() || 'Software Engineer',
          field: cfg.field,
          experience: cfg.experience,
          difficulty: cfg.difficulty,
          focus: cfg.focus.trim() || 'general fundamentals',
          company: cfg.company.trim() || 'a top company',
        },
        firstMessage: buildFirstMessage(cfg),
      };

      try {
        await vapi.start(ASSISTANT_ID, overrides);
      } catch (err) {
        console.error('Vapi start failed:', err);
        if (!cancelled) {
          setErrorMsg('Could not start the interview call. Check your microphone permission and Vapi keys.');
          setPhase('error');
        }
      }
    };

    // Defer so no setState runs synchronously inside the effect body.
    Promise.resolve().then(() => { if (!cancelled) run(); });

    return () => {
      cancelled = true;
      const vapi = vapiRef.current;
      vapiRef.current = null;
      try { vapi?.removeAllListeners(); } catch { /* noop */ }
      try { vapi?.stop(); } catch { /* noop */ }
    };
  }, [open, started]);

  if (!open) return null;

  const updateConfig = (patch: Partial<InterviewConfig>) => setConfig((c) => ({ ...c, ...patch }));

  const startInterview = () => {
    configRef.current = config;
    setStarted(true);
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    try { vapiRef.current?.setMuted(next); } catch { /* noop */ }
  };

  const end = () => {
    try { vapiRef.current?.stop(); } catch { /* noop */ }
    setStarted(false);
    onClose();
  };

  // ── Setup view ────────────────────────────────────────────────────────────
  if (!started) {
    const inputClass =
      'w-full rounded-lg bg-white/[0.05] border border-white/10 px-3.5 py-2.5 text-sm text-white ' +
      'placeholder-white/30 transition-all focus:outline-none focus:border-brand-500/60 focus:ring-4 focus:ring-brand-500/15';
    const labelClass = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40';
    return (
      <div
        className="scroll-slim-dark fixed inset-0 z-50 flex flex-col items-center overflow-y-auto text-white"
        style={{ background: OVERLAY_BG }}
      >
        <div className="z-10 w-full max-w-lg px-6 py-10" style={{ animation: 'ivFadeIn 0.4s ease' }}>
          {/* Header */}
          <div className="mb-7 flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500">
                <Mic className="h-5 w-5 text-white" strokeWidth={2.2} />
              </span>
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Interview Studio</h2>
                <p className="mt-0.5 text-[12px] text-white/45">
                  Live voice practice — these preferences are sent to your interviewer.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={end}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] transition-colors hover:bg-white/[0.12]"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form card */}
          <div className="space-y-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
            <div>
              <label className={labelClass}>Interview type</label>
              <div className="flex flex-wrap gap-2">
                {INTERVIEW_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => updateConfig({ type: t })}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                      config.type === t
                        ? 'border-brand-500 bg-brand-500 text-white'
                        : 'border-white/10 bg-white/[0.04] text-white/70 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Role / Position</label>
              <input
                className={inputClass}
                value={config.role}
                onChange={(e) => updateConfig({ role: e.target.value })}
                placeholder="e.g. Software Engineer, Data Analyst"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Field</label>
                <select
                  className={`${inputClass} cursor-pointer appearance-none`}
                  value={config.field}
                  onChange={(e) => updateConfig({ field: e.target.value })}
                >
                  {FIELDS.map((f) => <option key={f} value={f} className="bg-ink-900">{f}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Difficulty</label>
                <select
                  className={`${inputClass} cursor-pointer appearance-none`}
                  value={config.difficulty}
                  onChange={(e) => updateConfig({ difficulty: e.target.value })}
                >
                  {DIFFICULTIES.map((d) => <option key={d} value={d} className="bg-ink-900">{d}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Experience level</label>
              <select
                className={`${inputClass} cursor-pointer appearance-none`}
                value={config.experience}
                onChange={(e) => updateConfig({ experience: e.target.value })}
              >
                {EXPERIENCE_LEVELS.map((x) => <option key={x} value={x} className="bg-ink-900">{x}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass}>
                Focus areas <span className="font-normal normal-case tracking-normal text-white/30">(optional)</span>
              </label>
              <input
                className={inputClass}
                value={config.focus}
                onChange={(e) => updateConfig({ focus: e.target.value })}
                placeholder="e.g. DSA, OOP, DBMS, System Design"
              />
            </div>

            <div>
              <label className={labelClass}>
                Target company <span className="font-normal normal-case tracking-normal text-white/30">(optional)</span>
              </label>
              <input
                className={inputClass}
                value={config.company}
                onChange={(e) => updateConfig({ company: e.target.value })}
                placeholder="e.g. Google, JP Morgan"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={startInterview}
            disabled={!config.role.trim()}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Mic className="h-4 w-4" strokeWidth={2.2} />
            Start interview
          </button>
          {!config.role.trim() && (
            <p className="mt-2.5 text-center text-[11px] text-white/40">Enter a role to begin.</p>
          )}
        </div>
      </div>
    );
  }

  // ── Live call view ────────────────────────────────────────────────────────
  const lastUserFinal = [...transcript].reverse().find((t) => t.role === 'user')?.content ?? '';
  const lastBotFinal = [...transcript].reverse().find((t) => t.role === 'assistant')?.content ?? '';
  const botLine = partialAssistant || lastBotFinal;
  const userLine = partialUser || lastUserFinal;

  const accent =
    phase === 'speaking' ? '#ed1c24' :
    phase === 'listening' ? '#f37021' :
    phase === 'ended' ? '#94a3b8' :
    phase === 'error' ? '#ef4444' : '#f59e0b';

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center overflow-hidden text-white"
      style={{ background: OVERLAY_BG }}
    >
      {/* Top bar */}
      <div className="z-10 flex w-full shrink-0 items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3 rounded-full border border-white/[0.08] bg-white/[0.04] py-1.5 pl-3.5 pr-4">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: accent }} />
          <div className="leading-tight">
            <p className="text-[13px] font-semibold tracking-wide">Interview Studio · Live</p>
            <p className="text-[11px] text-white/50">{config.type} · {config.role.trim() || config.field}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={end}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] transition-colors hover:bg-white/[0.12]"
          title="End interview"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Center: orb + captions */}
      <div className="z-10 flex min-h-0 w-full flex-1 flex-col items-center justify-center px-6">
        <div className="relative flex items-center justify-center" style={{ width: 260, height: 260 }}>
          {(phase === 'listening' || phase === 'speaking') &&
            [0, 1, 2].map((i) => (
              <span
                key={i}
                className="absolute rounded-full"
                style={{ width: 200, height: 200, background: accent, animation: `ivRingPulse 2.6s ${i * 0.85}s ease-out infinite` }}
              />
            ))}

          <div
            ref={orbRef}
            className="relative rounded-full"
            style={{
              width: 168, height: 168,
              background: '#F37021',
              transform: 'scale(var(--iv-level, 1))',
              transition: 'transform 90ms linear',
              animation:
                phase === 'speaking' ? 'ivBreathe 1.5s ease-in-out infinite'
                : phase === 'connecting' ? 'ivBreathe 2.6s ease-in-out infinite'
                : undefined,
            }}
          >
            {phase === 'connecting' && (
              <div
                className="absolute -inset-3 rounded-full border-2 border-white/15"
                style={{
                  borderTopColor: 'rgba(255,255,255,0.75)',
                  animation: 'ivSpinSlow 1.3s linear infinite',
                }}
              />
            )}
          </div>
        </div>

        {/* Status */}
        <p className="mt-7 text-sm font-medium tracking-wide" style={{ color: accent }}>
          {muted && phase !== 'error' && phase !== 'ended' ? 'Muted' : PHASE_LABEL[phase]}
        </p>

        {/* Captions */}
        <div className="mt-4 min-h-[5.5rem] w-full max-w-2xl text-center">
          {phase === 'error' ? (
            <p className="text-sm text-red-300">{errorMsg}</p>
          ) : phase === 'ended' && !botLine ? (
            <p className="text-sm text-white/60">Thanks for interviewing. You can close this and review your chat.</p>
          ) : (
            <>
              {botLine && (
                <p key={botLine} className="text-lg font-light leading-relaxed text-white/95 md:text-xl"
                   style={{ animation: 'ivFadeIn 0.4s ease' }}>
                  {botLine}
                </p>
              )}
              {userLine && <p className="mt-3 text-sm italic text-white/45">&ldquo;{userLine}&rdquo;</p>}
            </>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="z-10 flex w-full shrink-0 items-center justify-center gap-4 px-6 py-7">
        <button
          type="button"
          onClick={toggleMute}
          disabled={phase === 'error' || phase === 'ended'}
          className={`flex h-16 w-16 items-center justify-center rounded-full transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
            muted
              ? 'border border-white/15 bg-white/10 hover:bg-white/20'
              : 'bg-brand-500 hover:bg-brand-600'
          }`}
          title={muted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {muted ? (
            <MicOff className="h-6 w-6" strokeWidth={2} />
          ) : (
            <Mic className="h-6 w-6" strokeWidth={2} />
          )}
        </button>

        <button
          type="button"
          onClick={end}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 transition-colors hover:bg-red-600"
          title="End interview"
        >
          <PhoneOff className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
