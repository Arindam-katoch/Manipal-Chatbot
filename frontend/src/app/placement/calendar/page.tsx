"use client";

import { CalendarDays } from "lucide-react";
import { calendar, calColors, companyLogos, logoColors } from "../data";

export default function CompanyCalendarPage() {
  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      {/* Page header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Company calendar
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Upcoming placement events and deadlines
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600">
          <CalendarDays className="h-3.5 w-3.5 text-brand-500" />
          {calendar.length} scheduled events
        </span>
      </div>

      {/* Month group */}
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        June 2025
      </p>

      {/* Timeline */}
      <div className="relative space-y-3 pl-[72px]">
        {/* Rail */}
        <span className="absolute bottom-4 left-[28px] top-2 w-px bg-slate-200" />

        {calendar.map((ev, i) => (
          <div key={i} className="relative">
            {/* Date block on the rail */}
            <div className="absolute -left-[72px] top-1/2 flex h-[56px] w-[56px] -translate-y-1/2 flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-white leading-none shadow-card">
              <span className="text-base font-semibold tabular-nums text-slate-900">
                {ev.date.split(" ")[0]}
              </span>
              <span className="mt-1 whitespace-nowrap text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                {ev.date.split(" ")[1]}
              </span>
              <span className="mt-0.5 whitespace-nowrap text-[9px] font-medium uppercase tracking-wide text-slate-400">
                {ev.day}
              </span>
            </div>

            {/* Event card */}
            <div className="flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white px-5 py-4 shadow-card transition-shadow hover:shadow-card-hover">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${logoColors[ev.company]}`}
              >
                {companyLogos[ev.company]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-slate-900">{ev.company}</p>
                <p className="truncate text-xs text-slate-500">{ev.role}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ring-inset ${calColors[ev.color]}`}
              >
                {ev.type}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
