"use client";

import { ReadinessState, STEPS } from "@/lib/readiness";
import { SectionHeading } from "@/components/ui";

interface Props {
  state: ReadinessState;
  onToggleStep: (id: string) => void;
}

export function ExecutionRoadmap({ state, onToggleStep }: Props) {
  const done = STEPS.filter((s) => state.steps[s.id]).length;
  return (
    <section>
      <SectionHeading eyebrow="Before we send" title="Execution order">
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">{done}/{STEPS.length} done</span>
      </SectionHeading>

      <div className="mm-card rounded-2xl p-3 sm:p-5">
        <ol className="relative space-y-1">
          {STEPS.map((step) => {
            const checked = !!state.steps[step.id];
            return (
              <li key={step.id}>
                <button
                  onClick={() => onToggleStep(step.id)}
                  className="flex w-full items-start gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-zinc-50"
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      checked ? "bg-emerald-500 text-white" : "bg-[#fef0eb] text-[#d94d22]"
                    }`}
                  >
                    {checked ? (
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      step.number
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className={`text-sm font-semibold ${checked ? "text-zinc-400 line-through decoration-zinc-300" : "text-zinc-900"}`}>
                        {step.title}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">{step.owner}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-500">{step.summary}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
