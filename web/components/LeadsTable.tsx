"use client";

import { Lead } from "@/lib/pipeline";

const TIER_STYLES = {
  top: "bg-emerald-100 text-emerald-700",
  qualified: "bg-blue-100 text-blue-700",
  warm: "bg-amber-100 text-amber-700",
  excluded: "bg-gray-100 text-gray-500",
};

const SENIORITY_STYLES: Record<string, string> = {
  HIGH_SENIORITY: "bg-purple-100 text-purple-700",
  PROBABLE_SENIORITY: "bg-indigo-100 text-indigo-600",
  INFERRED: "bg-gray-100 text-gray-600",
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
      <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center text-gray-400">
        No leads match your filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
          <tr>
            <th className="px-4 py-3 text-left">Email</th>
            <th className="px-4 py-3 text-left">Company / Domain</th>
            <th className="px-4 py-3 text-left">Title</th>
            <th className="px-4 py-3 text-left">Seniority</th>
            <th className="px-4 py-3 text-right">Score</th>
            <th className="px-4 py-3 text-right">Open %</th>
            <th className="px-4 py-3 text-right">Click %</th>
            <th className="px-4 py-3 text-right">Days</th>
            <th className="px-4 py-3 text-left">Tier</th>
            <th className="px-4 py-3 text-left">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-gray-800 max-w-[200px] truncate">
                {lead.email}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {lead.company ?? lead.domain}
              </td>
              <td className="px-4 py-3 text-gray-500 text-xs max-w-[140px] truncate">
                {lead.jobTitle ?? "—"}
              </td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SENIORITY_STYLES[lead.seniorityTier] ?? ""}`}>
                  {seniorityLabel(lead.seniorityTier)}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-semibold text-gray-800">
                {lead.score.toFixed(1)}
              </td>
              <td className="px-4 py-3 text-right text-gray-600">
                {lead.openRate.toFixed(1)}%
              </td>
              <td className="px-4 py-3 text-right text-gray-600">
                {lead.clickRate.toFixed(1)}%
              </td>
              <td className="px-4 py-3 text-right text-gray-500">
                {lead.subscriptionDays}
              </td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TIER_STYLES[lead.tier]}`}>
                  {lead.tier}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-gray-500">
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
