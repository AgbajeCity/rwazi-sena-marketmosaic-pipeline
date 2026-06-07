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
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Sena Lead Pipeline</h1>
            <p className="text-sm text-gray-500">Senior executives from Market Mosaic subscribers</p>
          </div>
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
            Rwazi Insights
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-6">
        <PipelineControl onComplete={fetchLeads} />

        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading leads…</div>
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
      <div className="text-4xl mb-3">📊</div>
      <h2 className="text-lg font-medium text-gray-700 mb-1">No leads yet</h2>
      <p className="text-sm text-gray-400">
        Click <strong>Run Pipeline</strong> above to scan Market Mosaic subscribers and surface qualified leads.
      </p>
    </div>
  );
}
