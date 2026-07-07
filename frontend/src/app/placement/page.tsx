"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  Building2,
  Loader2,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  stats as defaultStats,
  companies as defaultCompanies,
  calendar,
  sectors,
  logoColors,
  type Sector,
} from "./data";

// NEW: Import Recharts for the modal
import { 
  ComposedChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer 
} from 'recharts';

interface StatItem {
  label: string;
  value: string;
  sub: string;
}

const STAT_ICONS: LucideIcon[] = [Users, Wallet, Award, Building2];

// NEW: Mock data for the graph
const mockGraphData = [
  { student: 'Student 1', package: 6.5 },
  { student: 'Student 2', package: 8.0 },
  { student: 'Student 3', package: 8.5 },
  { student: 'Student 4', package: 10.0 },
  { student: 'Student 5', package: 12.0 },
  { student: 'Student 6', package: 15.0 }, 
];

export default function CompaniesAndStats() {
  const [stats, setStats] = useState<StatItem[]>(defaultStats);
  const [companies] = useState(defaultCompanies);
  const [progress, setProgress] = useState({ placed: 847, total: 1000 });
  const [sectorFilter, setSectorFilter] = useState<"All" | Sector>("All");
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // NEW: State to control the modal
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    async function fetchStats() {
      try {
        setIsLoading(true);
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://manipal-chatbot.onrender.com";
        const res = await fetch(`${baseUrl}/mock/placement-stats`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const resJson = await res.json();
        const rootData = resJson.data || resJson;

        const recordList = Array.isArray(rootData) ? rootData : null;

        if (recordList && recordList.length > 0) {
          const record = recordList[0];
          const placed = Number(record.placed_students) || 847;
          const total = Number(record.total_students) || 1000;
          const mappedStats = [
            {
              label: "Students placed",
              value: String(placed),
              sub: `Out of ${total} (Class of 2024)`,
            },
            {
              label: "Average package",
              value: `₹${record.average_salary_lpa || 12.4}L`,
              sub: "Per annum",
            },
            {
              label: "Highest package",
              value: `₹${record.highest_salary_lpa || 48}L`,
              sub: `${record.top_company || "Google"} — 2024`,
            },
            {
              label: "Companies visited",
              value: "134",
              sub: "This year",
            },
          ];
          setStats(mappedStats);
          setProgress({ placed, total });
          setIsLive(true);
        } else if (rootData.stats && Array.isArray(rootData.stats)) {
          setStats(rootData.stats);
          setIsLive(true);
        }
      } catch (error) {
        console.warn("Failed to fetch live placement stats, using mock fallback data:", error);
      } finally {
        setIsLoading(false);
        clearTimeout(timeoutId);
      }
    }

    fetchStats();

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  const filteredCompanies = companies.filter(
    (c) => sectorFilter === "All" || c.sector === sectorFilter
  );

  const sectorTotals = companies.reduce<Record<string, number>>((acc, c) => {
    acc[c.sector] = (acc[c.sector] || 0) + c.placed;
    return acc;
  }, {});
  const maxSectorTotal = Math.max(...Object.values(sectorTotals), 1);

  const placedPct = Math.min(100, (progress.placed / progress.total) * 100);
  const upcoming = calendar.slice(0, 4);

  return (
    <div className="animate-fade-up relative">
      {/* Page header */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Placement overview
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            {isLive ? "Live API data" : "Sample data"} · Class of 2024–25 · Manipal Institute of
            Technology, Bengaluru
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Live
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              Offline
            </span>
          )}
          <span className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
            Season active
          </span>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => {
          const Icon = STAT_ICONS[i % STAT_ICONS.length];
          return (
            <div
              key={s.label}
              className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover"
            >
              {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
                </div>
              )}
              <div className="flex items-start justify-between">
                <p className="text-xs font-medium text-slate-500">{s.label}</p>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                </span>
              </div>
              <p className="mt-1 text-[28px] font-semibold leading-tight tracking-tight text-slate-900">
                {s.value}
              </p>
              <p className="mt-1 text-xs text-slate-500">{s.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Recruiting partners */}
        <section className="rounded-xl border border-slate-200/80 bg-white shadow-card lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">
                Recruiting partners
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">Placement outcomes by company</p>
            </div>
            {/* Sector segmented control */}
            <div className="inline-flex rounded-lg bg-slate-100 p-1">
              {sectors.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSectorFilter(s)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    sectorFilter === s
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-semibold">Company</th>
                  <th className="px-5 py-3 text-right font-semibold">Placed</th>
                  <th className="px-5 py-3 text-right font-semibold">Avg CTC</th>
                  <th className="px-5 py-3 text-right font-semibold">Highest</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCompanies.map((c) => (
                  <tr 
                    key={c.name} 
                    onClick={() => setSelectedCompany(c)}
                    className="transition-colors hover:bg-slate-50/70 cursor-pointer"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${logoColors[c.name]}`}
                        >
                          {c.logo}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-semibold text-slate-900">
                            {c.name}
                          </span>
                          <span className="block text-[11px] text-slate-500">{c.sector}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right text-[13px] font-semibold tabular-nums text-slate-900">
                      {c.placed}
                    </td>
                    <td className="px-5 py-3.5 text-right text-[13px] tabular-nums text-slate-600">
                      {c.avg}
                    </td>
                    <td className="px-5 py-3.5 text-right text-[13px] tabular-nums text-slate-600">
                      {c.high}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredCompanies.length === 0 && (
              <p className="px-5 py-12 text-center text-sm text-slate-400">
                No companies in this sector yet.
              </p>
            )}
          </div>
        </section>

        {/* Side column */}
        <div className="space-y-5">
          {/* Class progress */}
          <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
            <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">
              Class placement progress
            </h2>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              {placedPct.toFixed(1)}
              <span className="text-lg text-slate-400">%</span>
            </p>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-brand-100">
              <div
                className="h-full rounded-full bg-brand-500 transition-[width] duration-700"
                style={{ width: `${placedPct}%` }}
              />
            </div>
            <p className="mt-2.5 text-xs text-slate-500">
              <span className="font-semibold text-slate-700 tabular-nums">
                {progress.placed.toLocaleString("en-IN")}
              </span>{" "}
              of {progress.total.toLocaleString("en-IN")} students placed
            </p>
          </section>

          {/* Offers by sector */}
          <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
            <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">
              Offers by sector
            </h2>
            <div className="mt-4 space-y-4">
              {Object.entries(sectorTotals).map(([sector, total]) => (
                <div key={sector}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600">{sector}</span>
                    <span className="text-xs font-semibold tabular-nums text-slate-900">
                      {total}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-brand-100">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${(total / maxSectorTotal) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Upcoming drives */}
          <section className="rounded-xl border border-slate-200/80 bg-white shadow-card">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">
                Upcoming drives
              </h2>
            </div>
            <ul className="divide-y divide-slate-100">
              {upcoming.map((ev) => (
                <li key={`${ev.company}-${ev.date}`} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-50 leading-none ring-1 ring-inset ring-slate-200/70">
                    <span className="text-[13px] font-semibold text-slate-900">
                      {ev.date.split(" ")[0]}
                    </span>
                    <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                      {ev.date.split(" ")[1]}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-slate-900">
                      {ev.company}
                    </span>
                    <span className="block truncate text-[11px] text-slate-500">{ev.type}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/placement/calendar"
              className="flex items-center justify-center gap-1.5 border-t border-slate-100 px-5 py-3 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50/60 hover:text-brand-700"
            >
              View full calendar
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </section>
        </div>
      </div>

      {/* NEW: Recharts Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 relative">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedCompany.name}</h2>
                <p className="text-sm text-slate-500">Package Distribution (Mock Data)</p>
              </div>
              <button 
                onClick={() => setSelectedCompany(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xl px-2 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Recharts Graph */}
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={mockGraphData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <XAxis dataKey="student" hide />
                  <YAxis label={{ value: 'Package (LPA)', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
                  <Tooltip formatter={(value: number) => [`${value} LPA`, 'Package']} />
                  
                  <Bar dataKey="package" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  
                  {/* Dynamic reference line using the clicked company's actual average */}
                  <ReferenceLine 
                    y={parseFloat(selectedCompany.avg) || 10} 
                    stroke="#ef4444" 
                    strokeDasharray="5 5" 
                    label={{ position: 'top', value: `Avg: ${selectedCompany.avg} LPA`, fill: '#ef4444' }} 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
