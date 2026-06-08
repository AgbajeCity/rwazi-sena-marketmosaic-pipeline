"use client";

import { Lead } from "@/lib/pipeline";

const TIER_STYLES: Record<string, string> = {
  top: "bg-indigo-100 text-indigo-700",
  qualified: "bg-emerald-100 text-emerald-700",
  warm: "bg-amber-100 text-amber-700",
  excluded: "bg-gray-100 text-gray-500",
};

const SENIORITY_STYLES: Record<string, string> = {
  HIGH_SENIORITY: "bg-blue-100 text-blue-700",
  PROBABLE_SENIORITY: "bg-slate-100 text-slate-600",
  INFERRED: "bg-gray-100 text-gray-500",
};

const RECOMMENDED_ACTION: Record<string, string> = {
  top: "Immediate outreach",
  qualified: "Nurture sequence",
  warm: "Monitor",
};

interface Props {
  leads: Lead[];
}

export function LeadsTable({ leads }: Props) {
  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white p-14 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-600">No leads match your filters</p>
        <p className="mt-1 text-xs text-gray-400">Try adjusting the search or filter options above.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 z-10 bg-gray-50 shadow-[0_1px_0_0_#e5e7eb] text-xs text-gray-500 uppercase tracking-wide">
          <tr>
            <th className="px-4 py-3 text-left font-semibold w-[200px]">Email</th>
            <th className="px-4 py-3 text-left font-semibold">Company / Domain</th>
            <th className="px-4 py-3 text-left font-semibold w-[140px]">Title</th>
            <th className="px-4 py-3 text-left font-semibold">Seniority</th>
            <th className="px-4 py-3 text-right font-semibold w-[70px]">Score</th>
            <th className="px-4 py-3 text-right font-semibold w-[70px]">Open %</th>
            <th className="px-4 py-3 text-right font-semibold w-[70px]">Click %</th>
            <th className="px-4 py-3 text-right font-semibold w-[60px]">Days</th>
            <th className="px-4 py-3 text-left font-semibold">Tier</th>
            <th className="px-4 py-3 text-left font-semibold">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 max-w-[200px]">
                <span
                  className="block truncate font-mono text-xs text-gray-800"
                  title={lead.email}
                >
                  {lead.email}
                </span>
              </td>
              <td className="px-4 py-3 max-w-[180px]">
                <span
                  className="block truncate text-gray-600 text-xs"
                  title={lead.company ?? lead.domain}
                >
                  {lead.company ?? lead.domain}
                </span>
              </td>
              <td className="px-4 py-3 max-w-[140px]">
                <span
                  className="block truncate text-gray-500 text-xs"
                  title={lead.jobTitle ?? ""}
                >
                  {lead.jobTitle ?? "—"}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SENIORITY_STYLES[lead.seniorityTier] ?? "bg-gray-100 text-gray-500"}`}>
                  {seniorityLabel(lead.seniorityTier)}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="font-bold text-gray-900">{lead.score.toFixed(1)}</span>
              </td>
              <td className="px-4 py-3 text-right text-gray-600 tabular-nums">
                {lead.openRate.toFixed(1)}%
              </td>
              <td className="px-4 py-3 text-right text-gray-600 tabular-nums">
                {lead.clickRate.toFixed(1)}%
              </td>
              <td className="px-4 py-3 text-right text-gray-500 tabular-nums">
                {lead.subscriptionDays}
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${TIER_STYLES[lead.tier] ?? "bg-gray-100 text-gray-500"}`}>
                  {lead.tier}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
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
