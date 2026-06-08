"use client";

import { useState, useEffect, useCallback } from "react";
import { Lead } from "@/lib/pipeline";
import { StatsCards } from "@/components/StatsCards";
import { PipelineControl } from "@/components/PipelineControl";
import { FilterBar, Filters } from "@/components/FilterBar";
import { LeadsTable } from "@/components/LeadsTable";

interface ApiResponse {
  leads: Lead[];
  totalProcessed: number;
  runDate: string | null;
}

export default function DashboardPage() {
  const [data, setData] = useState<ApiResponse>({ leads: [], totalProcessed: 0, runDate: null });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({ tier: "", seniority: "", search: "" });

  const fetchLeads = useCallback(async () => {
    const res = await fetch("/api/leads");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const filtered = data.leads.filter((l) => {
    if (filters.tier && l.tier !== filters.tier) return false;
    if (filters.seniority && l.seniorityTier !== filters.seniority) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!l.email.toLowerCase().includes(q) && !l.domain.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#08070d] text-zinc-100">
      {/* ── Hero header, echoing the Sena landing page ───────────────── */}
      <header className="sena-hero border-b border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6">
          {/* top bar */}
          <div className="flex items-center justify-between py-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold tracking-tight text-white lowercase">rwazi</span>
              <span className="hidden h-5 w-px bg-white/15 sm:block" />
              <span className="hidden rounded-full bg-[#856de6] px-2.5 py-1 text-[11px] font-semibold text-white sm:inline-block">
                Sena Decision AI
              </span>
            </div>
            <a
              href="https://rwazi.com/products/sena"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/15 px-4 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
            >
              About Sena ↗
            </a>
          </div>

          {/* hero copy */}
          <div className="pb-12 pt-6 text-center">
            <p className="mb-3 text-sm font-medium text-[#7df59e]">Prospect Pipeline</p>
            <h1 className="mx-auto max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
              <span className="italic text-[#7df59e]">Everyone has subscribers.</span>
              <br />
              Few know which ones decide.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              Sena scores Market Mosaic subscribers on real engagement signals and surfaces the
              senior decision-makers your team should be talking to.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <PipelineControl onComplete={fetchLeads} />

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <svg className="h-8 w-8 animate-spin text-[#7df59e]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm font-medium text-zinc-500">Loading prospects…</span>
          </div>
        ) : data.leads.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <StatsCards
              leads={data.leads}
              totalProcessed={data.totalProcessed}
              runDate={data.runDate}
            />

            <div className="space-y-3">
              <FilterBar
                filters={filters}
                onChange={setFilters}
                totalShown={filtered.length}
                totalLeads={data.leads.length}
              />
              <LeadsTable leads={filtered} />
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-white/[0.06] py-6">
        <div className="mx-auto max-w-7xl px-6 text-center text-xs text-zinc-600">
          Make your next big decision with certainty · <span className="text-zinc-400">Rwazi Insights</span>
        </div>
      </footer>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="sena-card rounded-2xl border border-dashed border-white/10 p-16 text-center">
      <div className="mb-4 flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#7df59e]/20 bg-[#7df59e]/10">
          <svg className="h-7 w-7 text-[#7df59e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
      </div>
      <h2 className="mb-1 text-lg font-semibold text-white">No prospects yet</h2>
      <p className="mx-auto max-w-sm text-sm text-zinc-400">
        Click <strong className="text-[#7df59e]">Run Pipeline</strong> to scan Market Mosaic subscribers and
        surface the senior executives ready to decide with confidence.
      </p>
    </div>
  );
}
