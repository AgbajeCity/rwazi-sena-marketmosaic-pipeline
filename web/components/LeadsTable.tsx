"use client";

import { useState, useCallback } from "react";
import { Lead } from "@/lib/pipeline";
import { recommendedAction, countryName, displayName } from "@/lib/leads";

const TIER_STYLES: Record<string, string> = {
  top: "bg-[#fef0eb] text-[#d94d22] border border-[#F15A29]/25",
  qualified: "bg-emerald-50 text-emerald-700 border border-emerald-500/20",
  warm: "bg-amber-50 text-amber-700 border border-amber-500/20",
  excluded: "bg-zinc-100 text-zinc-500 border border-zinc-200",
};

const SENIORITY_STYLES: Record<string, string> = {
  HIGH_SENIORITY: "bg-violet-50 text-violet-700 border border-violet-500/20",
  PROBABLE_SENIORITY: "bg-sky-50 text-sky-700 border border-sky-500/20",
  INFERRED: "bg-zinc-100 text-zinc-500 border border-zinc-200",
  UNVERIFIED: "bg-zinc-100 text-zinc-400 border border-zinc-200",
};

function seniorityLabel(tier: string): string {
  if (tier === "HIGH_SENIORITY") return "Confirmed";
  if (tier === "PROBABLE_SENIORITY") return "Corporate domain";
  if (tier === "INFERRED") return "Inferred";
  return "—";
}

type SortKey = "score" | "openRate" | "clickRate" | "subscriptionDays" | "name" | "company" | null;
type SortDir = "asc" | "desc";

interface Props {
  leads: Lead[];
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = score >= 70 ? "#F15A29" : score >= 50 ? "#10b981" : score >= 20 ? "#f59e0b" : "#94a3b8";
  return (
    <div className="flex items-center gap-2">
      <span className="font-semibold tabular-nums" style={{ color }}>
        {score.toFixed(1)}
      </span>
      <div className="w-14 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(email).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    },
    [email]
  );
  return (
    <button
      onClick={copy}
      title={copied ? "Copied!" : "Copy email"}
      className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-[#F15A29] focus:outline-none shrink-0"
    >
      {copied ? (
        <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

function DetailPanel({ lead, rank, onClose }: { lead: Lead; rank: number; onClose: () => void }) {
  const name = displayName(lead);
  const country = countryName(lead.country);
  const action = recommendedAction(lead.tier);
  const tierLabel = lead.tier === "top" ? "High-Priority" : lead.tier === "qualified" ? "Qualified" : lead.tier === "warm" ? "Warm" : "Excluded";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-y-auto">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-zinc-100 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">#{rank} Prospect</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TIER_STYLES[lead.tier] || TIER_STYLES.excluded}`}>
                {tierLabel}
              </span>
            </div>
            <h2 className="text-lg font-bold text-zinc-900">{name}</h2>
            <p className="text-sm text-zinc-500 mt-0.5">{lead.jobTitle || "—"}</p>
          </div>
          <button onClick={onClose} className="mt-1 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Score spotlight */}
        <div className="px-6 py-4 bg-gradient-to-r from-zinc-950 to-zinc-800 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Prospect Score</span>
            <span className="text-3xl font-black" style={{ color: lead.score >= 70 ? "#F15A29" : lead.score >= 50 ? "#10b981" : "#f59e0b" }}>
              {lead.score.toFixed(1)}
            </span>
          </div>
          <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, lead.score)}%`, background: lead.score >= 70 ? "#F15A29" : lead.score >= 50 ? "#10b981" : "#f59e0b" }} />
          </div>
          <p className="text-xs text-zinc-400 mt-2">{action}</p>
        </div>

        {/* Details grid */}
        <div className="px-6 py-4 flex flex-col gap-4">
          {/* Contact */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Contact</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-zinc-500 shrink-0">Email</span>
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-sm text-zinc-900 font-medium truncate">{lead.email}</span>
                  <CopyEmail email={lead.email} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Company</span>
                <span className="text-sm text-zinc-900 font-medium">{lead.company || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Country</span>
                <span className="text-sm text-zinc-900 font-medium">{country || lead.country || "—"}</span>
              </div>
              {lead.industry && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">Industry</span>
                  <span className="text-sm text-zinc-900 font-medium">{lead.industry}</span>
                </div>
              )}
              {lead.linkedinUrl && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">LinkedIn</span>
                  <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-sm text-[#F15A29] font-medium hover:underline">View profile ↗</a>
                </div>
              )}
            </div>
          </div>

          {/* Engagement */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Engagement</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-zinc-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-zinc-900">{lead.openRate != null ? `${lead.openRate.toFixed(1)}%` : "—"}</p>
                <p className="text-xs text-zinc-500 mt-0.5">Open rate</p>
              </div>
              <div className="bg-zinc-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-zinc-900">{lead.clickRate != null ? `${lead.clickRate.toFixed(1)}%` : "—"}</p>
                <p className="text-xs text-zinc-500 mt-0.5">Click rate</p>
              </div>
              <div className="bg-zinc-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-zinc-900">{lead.subscriptionDays ?? "—"}</p>
                <p className="text-xs text-zinc-500 mt-0.5">Days active</p>
              </div>
            </div>
          </div>

          {/* Classification */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Classification</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Seniority</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SENIORITY_STYLES[lead.seniorityTier] || SENIORITY_STYLES.UNVERIFIED}`}>
                  {seniorityLabel(lead.seniorityTier)}
                </span>
              </div>
              {lead.func && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">Function</span>
                  <span className="text-sm text-zinc-900 font-medium">{lead.func}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Domain</span>
                <span className="text-sm text-zinc-900 font-medium">{lead.domain || "—"}</span>
              </div>
            </div>
          </div>

          {/* Recommended action */}
          <div className="bg-[#fef0eb] border border-[#F15A29]/20 rounded-xl p-4">
            <p className="text-xs font-semibold text-[#d94d22] uppercase tracking-wider mb-1">Recommended Action</p>
            <p className="text-sm text-zinc-800 font-medium">{action}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

type SortableHeader = { key: SortKey; label: string };

const HEADERS: SortableHeader[] = [
  { key: "name", label: "Contact" },
  { key: "company", label: "Company / Title" },
  { key: null, label: "Function" },
  { key: null, label: "Seniority" },
  { key: null, label: "Country" },
  { key: "score", label: "Score" },
  { key: "openRate", label: "Open %" },
  { key: "clickRate", label: "Click %" },
  { key: "subscriptionDays", label: "Days" },
  { key: null, label: "Tier" },
  { key: null, label: "Recommended action" },
];

export function LeadsTable({ leads }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Lead | null>(null);

  const handleSort = useCallback(
    (key: SortKey) => {
      if (!key) return;
      if (sortKey === key) {
        setSortDir((d) => (d === "desc" ? "asc" : "desc"));
      } else {
        setSortKey(key);
        setSortDir("desc");
      }
    },
    [sortKey]
  );

  const sorted = [...leads].sort((a, b) => {
    if (!sortKey) return 0;
    let av: number | string = 0;
    let bv: number | string = 0;
    if (sortKey === "score") { av = a.score; bv = b.score; }
    else if (sortKey === "openRate") { av = a.openRate ?? -1; bv = b.openRate ?? -1; }
    else if (sortKey === "clickRate") { av = a.clickRate ?? -1; bv = b.clickRate ?? -1; }
    else if (sortKey === "subscriptionDays") { av = a.subscriptionDays ?? -1; bv = b.subscriptionDays ?? -1; }
    else if (sortKey === "name") { av = displayName(a).toLowerCase(); bv = displayName(b).toLowerCase(); }
    else if (sortKey === "company") { av = (a.company || "").toLowerCase(); bv = (b.company || "").toLowerCase(); }
    if (typeof av === "string" && typeof bv === "string") {
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  const selectedRank = selected ? sorted.findIndex((l) => l.email === selected.email) + 1 : 0;

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg className="w-10 h-10 text-zinc-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p className="text-sm font-medium text-zinc-600">No prospects match your filters</p>
        <p className="text-xs text-zinc-400 mt-1">Try adjusting the search or filter options above.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-zinc-100">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/70">
              {HEADERS.map(({ key, label }) => (
                <th
                  key={label}
                  onClick={() => handleSort(key)}
                  className={`px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap select-none ${key ? "cursor-pointer hover:text-zinc-800 hover:bg-zinc-100 transition-colors" : ""}`}
                >
                  <span className="flex items-center gap-1">
                    {label}
                    {key && sortKey === key && (
                      <span className="text-[#F15A29]">{sortDir === "desc" ? "↓" : "↑"}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((lead, idx) => {
              const name = displayName(lead);
              const country = countryName(lead.country);
              const action = recommendedAction(lead.tier);
              const openPct = lead.openRate != null ? `${lead.openRate.toFixed(1)}%` : "—";
              const clickPct = lead.clickRate != null ? `${lead.clickRate.toFixed(1)}%` : "—";
              const isSelected = selected?.email === lead.email;

              return (
                <tr
                  key={lead.email}
                  onClick={() => setSelected(isSelected ? null : lead)}
                  className={`border-b border-zinc-50 group cursor-pointer transition-colors ${isSelected ? "bg-orange-50/60" : "hover:bg-zinc-50"}`}
                >
                  {/* Contact */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400 font-mono w-5 text-right shrink-0">#{idx + 1}</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-zinc-900 leading-snug truncate max-w-[180px]">{name}</p>
                        <div className="flex items-center text-xs text-zinc-400 mt-0.5">
                          <span className="truncate max-w-[180px]">{lead.email}</span>
                          <CopyEmail email={lead.email} />
                        </div>
                      </div>
                    </div>
                  </td>
                  {/* Company / Title */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-800 leading-snug">{lead.company || "—"}</p>
                    <p className="text-xs text-zinc-400 mt-0.5 max-w-[220px] truncate">{lead.jobTitle || ""}</p>
                  </td>
                  {/* Function */}
                  <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">{lead.func || "—"}</td>
                  {/* Seniority */}
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${SENIORITY_STYLES[lead.seniorityTier] || SENIORITY_STYLES.UNVERIFIED}`}>
                      {seniorityLabel(lead.seniorityTier)}
                    </span>
                  </td>
                  {/* Country */}
                  <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">{country || lead.country || "—"}</td>
                  {/* Score */}
                  <td className="px-4 py-3"><ScoreBar score={lead.score} /></td>
                  {/* Open % */}
                  <td className="px-4 py-3 tabular-nums text-zinc-700">{openPct}</td>
                  {/* Click % */}
                  <td className="px-4 py-3 tabular-nums text-zinc-700">{clickPct}</td>
                  {/* Days */}
                  <td className="px-4 py-3 tabular-nums text-zinc-700">{lead.subscriptionDays ?? "—"}</td>
                  {/* Tier */}
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${TIER_STYLES[lead.tier] || TIER_STYLES.excluded}`}>
                      {lead.tier === "top" ? "Top" : lead.tier === "qualified" ? "Qualified" : lead.tier === "warm" ? "Warm" : lead.tier}
                    </span>
                  </td>
                  {/* Recommended action */}
                  <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">{action}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {selected && (
        <DetailPanel lead={selected} rank={selectedRank} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
