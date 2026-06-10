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
    <div className="min-h-screen bg-white text-zinc-900">
      {/* ── Dark nav bar, matching the Market Mosaic site header ───────── */}
      <div className="bg-[#121212]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#e8553a] text-sm font-bold text-white">r</span>
            <span className="text-xl font-bold tracking-tight text-white lowercase">rwazi</span>
            <span className="hidden h-4 w-px bg-white/20 sm:block" />
            <span className="hidden text-sm font-medium text-zinc-300 sm:inline-block">Market Mosaic</span>
          </div>
          <a
            href="https://newsletter.rwazi.com/"
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-[#e8553a] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#d4492f]"
          >
            Visit Market Mosaic ↗
          </a>
        </div>
      </div>

      {/* ── Hero band ──────────────────────────────────────────────────── */}
      <header className="mm-hero border-b border-black/10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="pb-14 pt-12 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#f08a72]">
              Sena Prospect Pipeline
            </p>
            <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              Everyone has subscribers.
              <br />
              <span className="text-[#e8553a]">Few know which ones decide.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-base">
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
            <svg className="h-8 w-8 animate-spin text-[#e8553a]" viewBox="0 0 24 24" fill="none">
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

      <footer className="mt-8 bg-[#121212] py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-6 text-center">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[#e8553a] text-xs font-bold text-white">r</span>
            <span className="text-sm font-bold lowercase text-white">rwazi</span>
          </div>
          <p className="text-xs text-zinc-500">
            Market Mosaic by Rwazi · Make your next big decision with certainty
          </p>
        </div>
      </footer>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mm-card rounded-2xl border-dashed p-16 text-center">
      <div className="mb-4 flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#e8553a]/20 bg-[#fdeee9]">
          <svg className="h-7 w-7 text-[#e8553a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
      </div>
      <h2 className="mb-1 text-lg font-semibold text-zinc-900">No prospects yet</h2>
      <p className="mx-auto max-w-sm text-sm text-zinc-500">
        Click <strong className="text-[#e8553a]">Run Pipeline</strong> to scan Market Mosaic subscribers and
        surface the senior executives ready to decide with confidence.
      </p>
    </div>
  );
}
