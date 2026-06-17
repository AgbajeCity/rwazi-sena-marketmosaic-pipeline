"use client";

import { ReadinessState, IDEAL_CRITERIA } from "@/lib/readiness";
import { CheckRow, SectionHeading } from "@/components/ui";

interface Props {
  state: ReadinessState;
  onToggleIdeal: (id: string) => void;
}

// The aspirational bar — what makes the launch land like a global banger.
// Optional to track; kept separate from the non-negotiable minimum.
export function IdealCriteria({ state, onToggleIdeal }: Props) {
  const done = IDEAL_CRITERIA.filter((_, i) => state.ideal[`ideal/${i}`]).length;
  return (
    <section>
      <SectionHeading eyebrow="If this send lands perfectly" title="Ideal outcomes">
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">{done}/{IDEAL_CRITERIA.length}</span>
      </SectionHeading>
      <div className="mm-card rounded-2xl p-3 sm:p-4">
        <div className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
          {IDEAL_CRITERIA.map((label, i) => {
            const id = `ideal/${i}`;
            return (
              <CheckRow key={id} checked={!!state.ideal[id]} onToggle={() => onToggleIdeal(id)}>
                {label}
              </CheckRow>
            );
          })}
        </div>
      </div>
    </section>
  );
}
