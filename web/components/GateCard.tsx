"use client";

import { useState } from "react";
import { Gate, Metric, ReadinessState, gateProgress, metricMet, comparatorSymbol } from "@/lib/readiness";
import { ProgressRing, CheckRow } from "@/components/ui";

interface Props {
  gate: Gate;
  state: ReadinessState;
  onToggleMilestone: (id: string) => void;
  onSetMetric: (id: string, value: number | null) => void;
}

export function GateCard({ gate, state, onToggleMilestone, onSetMetric }: Props) {
  const [open, setOpen] = useState(false);
  const p = gateProgress(gate, state);
  const ringColor = p.complete ? "#10b981" : "#F15A29";

  return (
    <div className={`mm-card overflow-hidden rounded-2xl ${p.complete ? "ring-1 ring-emerald-500/30" : ""}`}>
      {/* Header — always visible, click to expand */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-zinc-50/60"
      >
        <ProgressRing fraction={p.fraction} size={56} stroke={5} color={ringColor}>
          {p.complete ? (
            <svg className="h-5 w-5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <span className="text-xs font-bold tabular-nums text-zinc-700">{Math.round(p.fraction * 100)}%</span>
          )}
        </ProgressRing>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">Gate {gate.number}</span>
            {p.complete && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Complete</span>
            )}
          </div>
          <h3 className="truncate text-base font-bold text-zinc-900">{gate.name}</h3>
          <p className="truncate text-xs text-zinc-500">{gate.tagline}</p>
        </div>

        <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-500">{gate.owner}</span>
          <span className="text-[11px] tabular-nums text-zinc-400">
            {p.milestonesDone}/{p.milestonesTotal} · {p.metricsMet}/{p.metricsTotal} metrics
          </span>
        </div>

        <svg className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-zinc-100 px-5 py-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Milestones */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Required milestones</p>
              <div className="-mx-2">
                {gate.milestones.map((mst) => (
                  <CheckRow key={mst.id} checked={!!state.milestones[mst.id]} onToggle={() => onToggleMilestone(mst.id)}>
                    {mst.label}
                  </CheckRow>
                ))}
              </div>
            </div>

            {/* Metric groups */}
            <div className="space-y-5">
              {gate.metricGroups.map((group) => (
                <div key={group.title}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">{group.title}</p>
                  <div className="space-y-2">
                    {group.metrics.map((metric) => (
                      <MetricRow
                        key={metric.id}
                        metric={metric}
                        value={state.metrics[metric.id]}
                        onSet={(v) => onSetMetric(metric.id, v)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {gate.note && (
            <p className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <span className="mt-0.5 shrink-0">⚠</span> {gate.note}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function MetricRow({
  metric,
  value,
  onSet,
}: {
  metric: Metric;
  value: number | undefined;
  onSet: (value: number | null) => void;
}) {
  const met = metricMet(metric, value);
  const has = value !== undefined && !Number.isNaN(value);
  const fill =
    !has ? 0 : metric.comparator === "gte"
      ? Math.min(1, value! / metric.target)
      : value! <= metric.target ? 1 : Math.max(0.05, metric.target / value!);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2">
      <div className="flex items-center gap-3">
        <span className="flex-1 text-xs leading-snug text-zinc-600">{metric.label}</span>
        <div className="flex shrink-0 items-center gap-1.5">
          <input
            type="number"
            inputMode="decimal"
            value={has ? value : ""}
            onChange={(e) => {
              const raw = e.target.value;
              onSet(raw === "" ? null : Number(raw));
            }}
            placeholder="—"
            className="w-16 rounded-md border border-zinc-300 px-2 py-1 text-right text-sm font-semibold tabular-nums text-zinc-800 focus:border-[#F15A29]/50 focus:outline-none focus:ring-1 focus:ring-[#F15A29]/40"
          />
          <span className="whitespace-nowrap text-xs tabular-nums text-zinc-400">
            {comparatorSymbol(metric.comparator)} {metric.target}
            {metric.unit}
          </span>
          <span
            className={`flex h-4 w-4 items-center justify-center rounded-full text-white ${met ? "bg-emerald-500" : "bg-zinc-300"}`}
            title={met ? "Bar met" : "Bar not met"}
          >
            <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        </div>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-zinc-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${met ? "bg-emerald-500" : "bg-[#F15A29]"}`}
          style={{ width: `${fill * 100}%` }}
        />
      </div>
    </div>
  );
}
