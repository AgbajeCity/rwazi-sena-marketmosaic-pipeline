"use client";

import { ReadinessState, launchVerdict, overallReadiness } from "@/lib/readiness";
import { ProgressRing } from "@/components/ui";

export function LaunchVerdict({ state }: { state: ReadinessState }) {
  const v = launchVerdict(state);
  const pct = overallReadiness(state);
  const ringColor = v.ready ? "#10b981" : pct >= 60 ? "#F15A29" : "#f59e0b";

  return (
    <section className="mm-hero rounded-2xl border border-black/10 px-6 py-7 sm:px-8">
      <div className="flex flex-col items-center gap-7 lg:flex-row lg:items-center lg:gap-10">
        {/* Big readiness ring */}
        <div className="flex shrink-0 flex-col items-center gap-2">
          <ProgressRing fraction={pct / 100} size={132} stroke={11} color={ringColor} track="rgba(255,255,255,0.12)">
            <div className="text-center">
              <div className="text-3xl font-bold tabular-nums text-white">{pct}%</div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">ready</div>
            </div>
          </ProgressRing>
        </div>

        {/* Verdict + stats */}
        <div className="min-w-0 flex-1 text-center lg:text-left">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#f5956b]">Sena Launch Readiness</p>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
            {v.ready ? (
              <>Cleared to <span className="text-emerald-400">pick a launch date.</span></>
            ) : (
              <>Not ready to launch <span className="text-[#F15A29]">— yet.</span></>
            )}
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-zinc-300 lg:mx-0">
            We pick the date only when every launch gate is complete. The launch date is the reward for completing the
            milestones, not the forcing function.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3 sm:max-w-lg lg:max-w-xl">
            <Stat label="Gates complete" value={`${v.gatesDone}/${v.gatesTotal}`} good={v.gatesDone === v.gatesTotal} />
            <Stat label="Readiness review" value={v.reviewPassed ? "Pass" : "Below bar"} good={v.reviewPassed} />
            <Stat label="Minimum criteria" value={`${v.minCriteriaMet}/${v.minCriteriaTotal}`} good={v.minCriteriaMet === v.minCriteriaTotal} />
          </div>
        </div>
      </div>

      {/* Blockers */}
      {!v.ready && v.blockers.length > 0 && (
        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">What&rsquo;s standing between us and a date</p>
          <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {v.blockers.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F15A29]" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-center lg:text-left">
      <div className={`text-lg font-bold tabular-nums ${good ? "text-emerald-400" : "text-white"}`}>{value}</div>
      <div className="text-[11px] text-zinc-400">{label}</div>
    </div>
  );
}
