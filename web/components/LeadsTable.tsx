"use client";

import { Lead } from "@/lib/pipeline";

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
};

const RECOMMENDED_ACTION: Record<string, string> = {
  top: "Book a tailored demo",
  qualified: "Decision-ready nurture",
  warm: "Monitor signals",
};

interface Props {
  leads: Lead[];
}

export function LeadsTable({ leads }: Props) {
  if (leads.length === 0) {
    return (
      <div className="mm-card rounded-2xl border-dashed p-14 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50">
          <svg className="h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-zinc-700">No prospects match your filters</p>
        <p className="mt-1 text-xs text-zinc-500">Try adjusting the search or filter options above.</p>
      </div>
    );
  }

  return (
    <div className="mm-card overflow-x-auto rounded-2xl">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 z-10 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]">
          <tr>
            <th className="w-[200px] px-4 py-3 text-left font-semibold">Email</th>
            <th className="px-4 py-3 text-left font-semibold">Company / Domain</th>
            <th className="w-[140px] px-4 py-3 text-left font-semibold">Title</th>
            <th className="px-4 py-3 text-left font-semibold">Seniority</th>
            <th className="w-[70px] px-4 py-3 text-right font-semibold">Score</th>
            <th className="w-[70px] px-4 py-3 text-right font-semibold">Open %</th>
            <th className="w-[70px] px-4 py-3 text-right font-semibold">Click %</th>
            <th className="w-[60px] px-4 py-3 text-right font-semibold">Days</th>
            <th className="px-4 py-3 text-left font-semibold">Tier</th>
            <th className="px-4 py-3 text-left font-semibold">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {leads.map((lead) => (
            <tr key={lead.id} className="transition-colors hover:bg-zinc-50">
              <td className="max-w-[200px] px-4 py-3">
                <span
                  className="block truncate font-mono text-xs text-zinc-800"
                  title={lead.email}
                >
                  {lead.email}
                </span>
              </td>
              <td className="max-w-[180px] px-4 py-3">
                <span
                  className="block truncate text-xs text-zinc-600"
                  title={lead.company ?? lead.domain}
                >
                  {lead.company ?? lead.domain}
                </span>
              </td>
              <td className="max-w-[140px] px-4 py-3">
                <span
                  className="block truncate text-xs text-zinc-500"
                  title={lead.jobTitle ?? ""}
                >
                  {lead.jobTitle ?? "—"}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SENIORITY_STYLES[lead.seniorityTier] ?? "bg-zinc-100 text-zinc-500"}`}>
                  {seniorityLabel(lead.seniorityTier)}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="font-bold tabular-nums text-[#F15A29]">{lead.score.toFixed(1)}</span>
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-zinc-600">
                {lead.openRate.toFixed(1)}%
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-zinc-600">
                {lead.clickRate.toFixed(1)}%
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-zinc-500">
                {lead.subscriptionDays}
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${TIER_STYLES[lead.tier] ?? "bg-zinc-100 text-zinc-500"}`}>
                  {lead.tier}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-500">
                {RECOMMENDED_ACTION[lead.tier] ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function seniorityLabel(tier: string): string {
  switch (tier) {
    case "HIGH_SENIORITY": return "Confirmed";
    case "PROBABLE_SENIORITY": return "Corporate";
    case "INFERRED": return "Inferred";
    default: return tier;
  }
}
