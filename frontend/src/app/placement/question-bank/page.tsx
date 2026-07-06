"use client";

import { useState } from "react";
import { FileSearch, Search } from "lucide-react";
import {
  questions,
  companies,
  companyLogos,
  tagColors,
  logoColors,
  type CompanyName,
} from "../data";

export default function QuestionBankPage() {
  const [companyFilter, setCompanyFilter] = useState<"All" | CompanyName>("All");
  const [search, setSearch] = useState("");

  const filteredQuestions = questions.filter((q) => {
    const matchCompany = companyFilter === "All" || q.company === companyFilter;
    const matchSearch =
      q.q.toLowerCase().includes(search.toLowerCase()) ||
      q.company.toLowerCase().includes(search.toLowerCase()) ||
      q.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchCompany && matchSearch;
  });

  return (
    <div className="mx-auto max-w-4xl animate-fade-up">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Question bank</h1>
        <p className="mt-1 text-[13px] text-slate-500">
          Real interview questions from past placement drives
        </p>
      </div>

      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-card">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions, companies, or tags…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-[13px] text-slate-800 placeholder-slate-400 transition-all focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10"
          />
        </div>

        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value as "All" | CompanyName)}
          className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] font-medium text-slate-700 transition-all focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10"
        >
          <option value="All">All companies</option>
          {companies.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-slate-500">
          {filteredQuestions.length} {filteredQuestions.length === 1 ? "question" : "questions"}
        </span>
      </div>

      {/* Questions list */}
      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-white py-14 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
              <FileSearch className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium text-slate-600">No questions match your filters</p>
            <p className="text-xs text-slate-400">Try a different company or search term.</p>
          </div>
        ) : (
          filteredQuestions.map((q, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <div className="mb-2.5 flex items-center gap-2.5">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${logoColors[q.company]}`}
                >
                  {companyLogos[q.company]}
                </span>
                <span className="text-[13px] font-semibold text-slate-900">{q.company}</span>
                <span className="text-slate-300">·</span>
                <span className="text-xs font-medium text-slate-500">{q.role}</span>
                <span className="ml-auto rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {q.round}
                </span>
              </div>

              <p className="mb-3 text-sm leading-relaxed text-slate-700">{q.q}</p>

              <div className="flex flex-wrap gap-1.5">
                {q.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${tagColors[tag]}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
