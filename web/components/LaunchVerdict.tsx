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
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#f5956b]">Market Mosaic → Sena</p>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
            {v.ready ? (
              <>Ready to <span className="text-emerald-400">send to subscribers.</span></>
            ) : (
              <>Not ready to send <span className="text-[#F15A29]">— yet.</span></>
            )}
          </h1>

          <div className="mt-5 grid grid-cols-3 gap-3 sm:max-w-lg lg:max-w-xl">
            <Stat label="Gates" value={`${v.gatesDone}/${v.gatesTotal}`} good={v.gatesDone === v.gatesTotal} />
            <Stat label="Review" value={v.reviewPassed ? "Pass" : "Below bar"} good={v.reviewPassed} />
            <Stat label="Criteria" value={`${v.minCriteriaMet}/${v.minCriteriaTotal}`} good={v.minCriteriaMet === v.minCriteriaTotal} />
          </div>
        </div>
      </div>

      {/* Blockers */}
      {!v.ready && v.blockers.length > 0 && (
        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Blockers</p>
          <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {v.blockers.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F15A29]" />
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
