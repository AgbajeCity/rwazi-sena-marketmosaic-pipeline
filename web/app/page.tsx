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
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-600">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="4" height="12" rx="1" fill="currentColor" stroke="none" />
                <rect x="10" y="7" width="4" height="8" rx="1" fill="currentColor" stroke="none" />
                <rect x="17" y="5" width="4" height="10" rx="1" fill="currentColor" stroke="none" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 leading-tight">Sena Lead Pipeline</h1>
              <p className="text-xs text-gray-500 leading-tight">Senior executives from Market Mosaic subscribers</p>
            </div>
          </div>
          <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white tracking-wide">
            Rwazi Insights
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-6">
        <PipelineControl onComplete={fetchLeads} />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <svg className="w-8 h-8 text-indigo-500 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm text-gray-400 font-medium">Loading leads…</span>
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
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-white p-16 text-center">
      <div className="flex justify-center mb-4">
        <svg className="w-14 h-14 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-gray-700 mb-1">No leads yet</h2>
      <p className="text-sm text-gray-400 max-w-sm mx-auto">
        Click <strong className="text-gray-600">Run Pipeline</strong> above to scan Market Mosaic subscribers and surface qualified leads.
      </p>
    </div>
  );
}
