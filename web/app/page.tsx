"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GATES, ReadinessState, emptyState } from "@/lib/readiness";
import { LaunchVerdict } from "@/components/LaunchVerdict";
import { GateCard } from "@/components/GateCard";
import { ReadinessReview } from "@/components/ReadinessReview";
import { MinimumCriteria } from "@/components/MinimumCriteria";
import { ExecutionRoadmap } from "@/components/ExecutionRoadmap";
import { LaunchWindow } from "@/components/LaunchWindow";
import { IdealCriteria } from "@/components/IdealCriteria";
import { SectionHeading } from "@/components/ui";

type SaveState = "idle" | "saving" | "saved" | "error";

export default function LaunchReadinessPage() {
  const [state, setState] = useState<ReadinessState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const dirtyRef = useRef(false);

  // Load the shared team state once.
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/readiness", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as ReadinessState;
        setState({ ...emptyState(), ...data });
        setLastSaved(data.updatedAt ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Debounced autosave of the full state whenever the user changes something.
  // The first post-load state set is skipped via dirtyRef so we don't immediately
  // re-save what we just loaded.
  useEffect(() => {
    if (!dirtyRef.current) return;
    const t = setTimeout(async () => {
      setSaveState("saving");
      try {
        const res = await fetch("/api/readiness", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(state),
        });
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { updatedAt?: string };
        setSaveState("saved");
        setLastSaved(data.updatedAt ?? new Date().toISOString());
      } catch {
        setSaveState("error");
      }
    }, 700);
    return () => clearTimeout(t);
  }, [state]);

  // Single mutate helper — marks state dirty and applies an immutable update.
  const mutate = useCallback((fn: (prev: ReadinessState) => ReadinessState) => {
    dirtyRef.current = true;
    setState(fn);
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

  const setScore = useCallback((id: string, value: number) => {
    mutate((p) => ({ ...p, scores: { ...p.scores, [id]: value } }));
  }, [mutate]);

  const toggleCriterion = useCallback((id: string) => {
    mutate((p) => ({ ...p, criteria: { ...p.criteria, [id]: !p.criteria[id] } }));
  }, [mutate]);

  const toggleStep = useCallback((id: string) => {
    mutate((p) => ({ ...p, steps: { ...p.steps, [id]: !p.steps[id] } }));
  }, [mutate]);

  const toggleIdeal = useCallback((id: string) => {
    mutate((p) => ({ ...p, ideal: { ...p.ideal, [id]: !p.ideal[id] } }));
  }, [mutate]);

  const setTargetDate = useCallback((iso: string | null) => {
    mutate((p) => ({ ...p, targetDate: iso }));
  }, [mutate]);

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 border-b border-[#e5e7eb] bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <SenaMark />
            <div className="leading-tight">
              <div className="text-sm font-bold text-zinc-900">Sena Launch Readiness</div>
              <div className="text-[11px] text-zinc-500">Project owner · Peter Garazha</div>
            </div>
          </div>
          <SaveIndicator saveState={saveState} lastSaved={lastSaved} loading={loading} />
        </div>
      </div>

      <main className="mx-auto max-w-6xl space-y-10 px-6 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-32">
            <svg className="h-8 w-8 animate-spin text-[#F15A29]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm font-medium text-zinc-500">Loading launch readiness…</span>
          </div>
        ) : (
          <>
            <LaunchVerdict state={state} />

            <section>
              <SectionHeading eyebrow="Earn the right to launch" title="The launch gates">
                <span className="text-xs text-zinc-400">If any gate is weak, we delay the launch.</span>
              </SectionHeading>
              <div className="space-y-3">
                {GATES.map((gate) => (
                  <GateCard
                    key={gate.id}
                    gate={gate}
                    state={state}
                    onToggleMilestone={toggleMilestone}
                    onSetMetric={setMetric}
                  />
                ))}
              </div>
            </section>

            <ReadinessReview state={state} onSetScore={setScore} />
            <MinimumCriteria state={state} onToggleCriterion={toggleCriterion} />
            <ExecutionRoadmap state={state} onToggleStep={toggleStep} />
            <LaunchWindow state={state} onSetTargetDate={setTargetDate} />
            <IdealCriteria state={state} onToggleIdeal={toggleIdeal} />
          </>
        )}
      </main>

      <footer className="mt-8 border-t border-[#e5e7eb] py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6">
          <span className="text-xs font-semibold text-zinc-500">Sena Launch Readiness · Rwazi</span>
          <p className="text-xs text-zinc-400">
            The launch date is the reward for completing the milestones — not the forcing function.
          </p>
        </div>
      </footer>
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

// Compact Sena wordmark — orange decision dot + wordmark + by-rwazi.
function SenaMark() {
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F15A29] text-sm font-black text-white">S</span>
      <span className="flex items-baseline gap-1">
        <span className="text-base font-extrabold tracking-tight text-zinc-900">Sena</span>
        <span className="text-[10px] font-semibold text-zinc-400">by <span className="text-[#F15A29]">rwazi</span></span>
      </span>
    </span>
  );
}
