"use client";

import { ReadinessState, DATE_RULES, validateLaunchDate, gatesComplete } from "@/lib/readiness";
import { SectionHeading } from "@/components/ui";

interface Props {
  state: ReadinessState;
  onSetTargetDate: (iso: string | null) => void;
}

export function LaunchWindow({ state, onSetTargetDate }: Props) {
  const ready = gatesComplete(state);
  const result = validateLaunchDate(state.targetDate);

  return (
    <section>
      <SectionHeading eyebrow="Send date" title="Newsletter send window">
        {!ready && (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 ring-1 ring-amber-300/50">Planning only</span>
        )}
      </SectionHeading>
      <div className="mm-card rounded-2xl p-5">
        <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
          {/* Candidate date + structural validation */}
          <div className="lg:w-64">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-400">Send date</label>
            <input
              type="date"
              value={state.targetDate ?? ""}
              onChange={(e) => onSetTargetDate(e.target.value || null)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800 focus:border-[#F15A29]/50 focus:outline-none focus:ring-1 focus:ring-[#F15A29]/40"
            />
            {result && (
              <ul className="mt-3 space-y-1.5">
                {result.checks.map((c) => (
                  <li key={c.rule} className="flex items-start gap-2 text-xs">
                    <span className={`mt-0.5 font-bold ${c.ok ? "text-emerald-500" : "text-red-500"}`}>
                      {c.ok ? "✓" : "✗"}
                    </span>
                    <span className={c.ok ? "text-zinc-600" : "text-red-600"}>{c.rule}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-[11px] text-zinc-400">{DATE_RULES.preferred}</p>
          </div>

          {/* Judgement rules */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Confirm by judgement</p>
            <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
              {DATE_RULES.judgement.map((r) => (
                <li key={r} className="flex items-start gap-2 text-xs text-zinc-600">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
