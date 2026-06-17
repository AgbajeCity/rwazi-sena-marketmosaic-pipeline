"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Lead } from "@/lib/pipeline";
import { StatsCards } from "@/components/StatsCards";
import { PipelineControl } from "@/components/PipelineControl";
import { FilterBar } from "@/components/FilterBar";
import { LeadsTable } from "@/components/LeadsTable";
import { MarketMosaicLogo } from "@/components/Logo";
import { BUDGET_FUNCTIONS } from "@/lib/config";
import { countryName, displayName } from "@/lib/leads";
import { regionForCountry, isEmergingMarket } from "@/lib/regions";
import {
  Filters,
  SavedView,
  DEFAULT_FILTERS,
  loadFilters,
  saveFilters,
  loadViews,
  saveViews,
  newViewId,
} from "@/lib/views";
import { GATES, ReadinessState, emptyState } from "@/lib/readiness";
import { LaunchVerdict } from "@/components/LaunchVerdict";
import { GateCard } from "@/components/GateCard";
import { ReadinessReview } from "@/components/ReadinessReview";
import { MinimumCriteria } from "@/components/MinimumCriteria";
import { ExecutionRoadmap } from "@/components/ExecutionRoadmap";
import { LaunchWindow } from "@/components/LaunchWindow";
import { IdealCriteria } from "@/components/IdealCriteria";
import { SectionHeading } from "@/components/ui";

interface ApiResponse {
  leads: Lead[];
  totalProcessed: number;
  runDate: string | null;
}

type Tab = "pipeline" | "readiness";
type SaveState = "idle" | "saving" | "saved" | "error";

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("pipeline");

  // ── Pipeline state ────────────────────────────────────────────────────
  const [data, setData] = useState<ApiResponse>({ leads: [], totalProcessed: 0, runDate: null });
  const [loading, setLoading] = useState(true);
  // Lazy-init from localStorage so each visitor reopens to their own last view.
  // Safe against hydration: the first render shows the loading spinner (not the
  // FilterBar), so the restored value never affects server/client markup.
  const [filters, setFilters] = useState<Filters>(loadFilters);
  const [savedViews, setSavedViews] = useState<SavedView[]>(loadViews);

  const fetchLeads = useCallback(async () => {
    const res = await fetch("/api/leads");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, []);

  // Initial load. setData/setLoading run after an await inside fetchLeads, so
  // this is an async data sync — not the synchronous cascading render the rule guards against.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // Persist the active filters + saved views (write-only — no setState here).
  useEffect(() => { saveFilters(filters); }, [filters]);
  useEffect(() => { saveViews(savedViews); }, [savedViews]);

  // ── Launch readiness state ────────────────────────────────────────────
  const [readiness, setReadiness] = useState<ReadinessState>(emptyState);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [readinessLoaded, setReadinessLoaded] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const dirtyRef = useRef(false);

  const loadReadiness = useCallback(async () => {
    setReadinessLoading(true);
    try {
      const res = await fetch("/api/readiness", { cache: "no-store" });
      if (res.ok) {
        const d = (await res.json()) as ReadinessState;
        setReadiness({ ...emptyState(), ...d });
        setLastSaved(d.updatedAt ?? null);
      }
    } finally {
      setReadinessLoading(false);
      setReadinessLoaded(true);
    }
  }, []);

  // Load readiness lazily when user first switches to that tab.
  useEffect(() => {
    if (tab === "readiness" && !readinessLoaded) loadReadiness();
  }, [tab, readinessLoaded, loadReadiness]);

  // Debounced autosave for readiness.
  useEffect(() => {
    if (!dirtyRef.current) return;
    const t = setTimeout(async () => {
      setSaveState("saving");
      try {
        const res = await fetch("/api/readiness", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(readiness),
        });
        if (!res.ok) throw new Error();
        const d = (await res.json()) as { updatedAt?: string };
        setSaveState("saved");
        setLastSaved(d.updatedAt ?? new Date().toISOString());
      } catch {
        setSaveState("error");
      }
    }, 700);
    return () => clearTimeout(t);
  }, [readiness]);

  const mutate = useCallback((fn: (prev: ReadinessState) => ReadinessState) => {
    dirtyRef.current = true;
    setReadiness(fn);
  }, []);

  const toggleMilestone = useCallback((id: string) => {
    mutate((p) => ({ ...p, milestones: { ...p.milestones, [id]: !p.milestones[id] } }));
  }, [mutate]);

  const setMetric = useCallback((id: string, value: number | null) => {
    mutate((p) => {
      const metrics = { ...p.metrics };
      if (value === null) delete metrics[id];
      else metrics[id] = value;
      return { ...p, metrics };
    });
  }, [mutate]);

  const setScore = useCallback((id: string, value: number | null) => {
    mutate((p) => {
      const scores = { ...p.scores };
      if (value === null) delete scores[id];
      else scores[id] = value;
      return { ...p, scores };
    });
  }, [mutate]);

  const toggleCriterion = useCallback((id: string) => {
    mutate((p) => ({ ...p, criteria: { ...p.criteria, [id]: !p.criteria[id] } }));
  }, [mutate]);

  const toggleStep = useCallback((id: string) => {
    mutate((p) => ({ ...p, steps: { ...p.steps, [id]: !p.steps[id] } }));
  }, [mutate]);

  const setTargetDate = useCallback((date: string | null) => {
    mutate((p) => ({ ...p, targetDate: date }));
  }, [mutate]);

  const toggleIdeal = useCallback((id: string) => {
    mutate((p) => ({ ...p, ideal: { ...p.ideal, [id]: !p.ideal[id] } }));
  }, [mutate]);

  const handleSaveView = useCallback((name: string) => {
    setSavedViews((prev) => [...prev, { id: newViewId(), name, filters }]);
  }, [filters]);

  const handleApplyView = useCallback((view: SavedView) => {
    setFilters({ ...DEFAULT_FILTERS, ...view.filters });
  }, []);

  const handleDeleteView = useCallback((id: string) => {
    setSavedViews((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const handleReset = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  // Distinct countries present in the data, for the country filter dropdown.
  const countries = (() => {
    const codes = new Set<string>();
    for (const l of data.leads) if (l.country) codes.add(l.country);
    return Array.from(codes)
      .map((code) => ({ code, name: countryName(code) || code }))
      .sort((a, b) => a.name.localeCompare(b.name));
  })();

  const filtered = data.leads.filter((l) => {
    if (filters.tier && l.tier !== filters.tier) return false;
    if (filters.seniority && l.seniorityTier !== filters.seniority) return false;
    if (filters.func) {
      if (filters.func === "__budget__") {
        if (!l.func || !BUDGET_FUNCTIONS.has(l.func)) return false;
      } else if (l.func !== filters.func) {
        return false;
      }
    }
    if (filters.region) {
      if (filters.region === "__emerging__") {
        if (!isEmergingMarket(l.country)) return false;
      } else if (regionForCountry(l.country) !== filters.region) {
        return false;
      }
    }
    if (filters.country && l.country !== filters.country) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const haystack = [
        displayName(l),
        l.email,
        l.domain,
        l.company ?? "",
        l.industry ?? "",
        l.jobTitle ?? "",
        l.func ?? "",
        l.topics ?? "",
        l.location ?? "",
        countryName(l.country),
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* ── Nav bar ── */}
      <div className="sticky top-0 z-30 border-b border-[#e5e7eb] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <MarketMosaicLogo />
            <nav className="hidden items-center gap-1 sm:flex">
              <button
                onClick={() => setTab("pipeline")}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${tab === "pipeline" ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"}`}
              >
                Prospect Pipeline
              </button>
              <button
                onClick={() => setTab("readiness")}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${tab === "readiness" ? "bg-[#F15A29] text-white" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"}`}
              >
                Sena Newsletter Readiness
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {tab === "readiness" && (
              <SaveIndicator saveState={saveState} lastSaved={lastSaved} loading={readinessLoading} />
            )}
            <a
              href="https://newsletter.rwazi.com/"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-zinc-300 px-4 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-50"
            >
              Market Mosaic ↗
            </a>
          </div>
        </div>
        {/* Mobile tab bar */}
        <div className="flex border-t border-[#e5e7eb] sm:hidden">
          <button
            onClick={() => setTab("pipeline")}
            className={`flex-1 py-2 text-xs font-semibold transition-colors ${tab === "pipeline" ? "bg-zinc-900 text-white" : "text-zinc-500"}`}
          >
            Pipeline
          </button>
          <button
            onClick={() => setTab("readiness")}
            className={`flex-1 py-2 text-xs font-semibold transition-colors ${tab === "readiness" ? "bg-[#F15A29] text-white" : "text-zinc-500"}`}
          >
            Send Readiness
          </button>
        </div>
      </div>

      {tab === "pipeline" && (
        <>
          {/* ── Hero band ── */}
          <header className="mm-hero border-b border-black/10">
            <div className="mx-auto max-w-7xl px-6">
              <div className="pb-14 pt-12 text-center">
                <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#f5956b]">
                  Internal · Sena Prospect Pipeline
                </p>
                <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
                  We have the subscribers.
                  <br />
                  <span className="text-[#F15A29]">Now we know which ones decide.</span>
                </h1>
                <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">
                  Built by the Rwazi Insights team. It scores our Market Mosaic subscribers
                  and surfaces pre-qualified executives for Sena and Rwazi&rsquo;s enterprise monetisation.
                </p>
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-7xl space-y-5 px-6 py-8">
            <PipelineControl onComplete={fetchLeads} />

            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24">
                <svg className="h-8 w-8 animate-spin text-[#F15A29]" viewBox="0 0 24 24" fill="none">
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
                    countries={countries}
                    savedViews={savedViews}
                    onSaveView={handleSaveView}
                    onApplyView={handleApplyView}
                    onDeleteView={handleDeleteView}
                    onReset={handleReset}
                  />
                  <LeadsTable leads={filtered} />
                </div>
              </>
            )}
          </main>
        </>
      )}

      {tab === "readiness" && (
        <main className="mx-auto max-w-6xl space-y-10 px-6 py-8">
          {readinessLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-32">
              <svg className="h-8 w-8 animate-spin text-[#F15A29]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm font-medium text-zinc-500">Loading launch readiness…</span>
            </div>
          ) : (
            <>
              <LaunchVerdict state={readiness} />

              <section>
                <SectionHeading eyebrow="Before we hit send" title="Send readiness" />
                <div className="space-y-3">
                  {GATES.map((gate) => (
                    <GateCard
                      key={gate.id}
                      gate={gate}
                      state={readiness}
                      onToggleMilestone={toggleMilestone}
                      onSetMetric={setMetric}
                    />
                  ))}
                </div>
              </section>

              <ReadinessReview state={readiness} onSetScore={setScore} />
              <MinimumCriteria state={readiness} onToggleCriterion={toggleCriterion} />
              <ExecutionRoadmap state={readiness} onToggleStep={toggleStep} />
              <LaunchWindow state={readiness} onSetTargetDate={setTargetDate} />
              <IdealCriteria state={readiness} onToggleIdeal={toggleIdeal} />
            </>
          )}
        </main>
      )}

      <footer className="mt-8 border-t border-[#e5e7eb] py-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <MarketMosaicLogo className="opacity-70" />
          <p className="text-xs text-zinc-400">
            Internal tool · Built by the Rwazi Insights team · Data from Market Mosaic
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
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#F15A29]/20 bg-[#fef0eb]">
          <svg className="h-7 w-7 text-[#F15A29]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
      </div>
      <h2 className="mb-1 text-lg font-semibold text-zinc-900">No prospects yet</h2>
      <p className="mx-auto max-w-sm text-sm text-zinc-500">
        Click <strong className="text-[#F15A29]">Run Pipeline</strong> to scan Market Mosaic subscribers and
        surface the senior executives ready to decide with confidence.
      </p>
    </div>
  );
}

function SaveIndicator({ saveState, lastSaved, loading }: { saveState: SaveState; lastSaved: string | null; loading: boolean }) {
  if (loading) return <span className="text-xs text-zinc-400">Loading…</span>;
  const time = lastSaved
    ? new Date(lastSaved).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;
  return (
    <div className="flex items-center gap-2 text-xs">
      {saveState === "saving" && <span className="text-zinc-400">Saving…</span>}
      {saveState === "error" && <span className="font-medium text-red-500">Couldn&rsquo;t sync</span>}
      {(saveState === "saved" || saveState === "idle") && (
        <span className="flex items-center gap-1.5 text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {time ? `Saved · ${time}` : "Shared with the team"}
        </span>
      )}
    </div>
  );
}
