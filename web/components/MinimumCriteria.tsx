"use client";

import { ReadinessState, MIN_CRITERIA, criterionMet, minCriteriaMetCount } from "@/lib/readiness";
import { CheckRow, SectionHeading } from "@/components/ui";

interface Props {
  state: ReadinessState;
  onToggleCriterion: (id: string) => void;
}

// The non-negotiable shortlist. Items tied to a gate metric light up
// automatically (read-only, "auto" badge); the rest are manual confirmations.
export function MinimumCriteria({ state, onToggleCriterion }: Props) {
  const met = minCriteriaMetCount(state);
  const total = MIN_CRITERIA.length;
  const allMet = met === total;

  return (
    <section>
      <SectionHeading eyebrow="Non-negotiable" title="Minimum criteria">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            allMet ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/30" : "bg-zinc-100 text-zinc-600"
          }`}
        >
          {met}/{total} met
        </span>
      </SectionHeading>

      <div className="mm-card rounded-2xl p-3 sm:p-4">
        <div className="grid gap-x-6 sm:grid-cols-2">
          {MIN_CRITERIA.map((crit) => {
            const checked = criterionMet(crit, state);
            const derived = !!crit.metricId;
            return (
              <div key={crit.id} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <CheckRow checked={checked} readOnly={derived} onToggle={() => onToggleCriterion(crit.id)}>
                    {crit.label}
                  </CheckRow>
                </div>
                {derived && (
                  <span
                    className="shrink-0 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-zinc-400"
                    title="Tracked automatically from a gate metric"
                  >
                    auto
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
