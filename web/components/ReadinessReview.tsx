"use client";

import { ReadinessState, REVIEW_CATEGORIES, reviewPass } from "@/lib/readiness";
import { SectionHeading } from "@/components/ui";

interface Props {
  state: ReadinessState;
  onSetScore: (id: string, value: number) => void;
}

// The final gate: leadership scores each category 0–10. No date is selected
// before this review passes (no category below 8; Product & Enterprise need 9).
export function ReadinessReview({ state, onSetScore }: Props) {
  const passed = reviewPass(state);
  return (
    <section>
      <SectionHeading eyebrow="Final gate" title="Readiness review">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            passed ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/30" : "bg-amber-50 text-amber-700 ring-1 ring-amber-500/30"
          }`}
        >
          {passed ? "Passes the bar" : "Below the bar"}
        </span>
      </SectionHeading>

      <div className="mm-card rounded-2xl p-5">
        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {REVIEW_CATEGORIES.map((c) => {
            const score = state.scores[c.id] ?? 0;
            const ok = score >= c.min;
            return (
              <div key={c.id}>
                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-zinc-700">{c.label}</span>
                  <span className="text-xs tabular-nums text-zinc-400">
                    needs {c.min}/10
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={score}
                    onChange={(e) => onSetScore(c.id, Number(e.target.value))}
                    className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-200 accent-[#F15A29]"
                    style={{ accentColor: ok ? "#10b981" : "#F15A29" }}
                  />
                  <span
                    className={`w-12 shrink-0 rounded-md px-2 py-0.5 text-center text-sm font-bold tabular-nums ${
                      ok ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {score}/10
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 border-t border-zinc-100 pt-3 text-[11px] text-zinc-400">
          Min: 8/10 across all · Product &amp; Enterprise must be 9/10
        </p>
      </div>
    </section>
  );
}
