"use client";

import { Lead } from "@/lib/pipeline";

interface Props {
  leads: Lead[];
  totalProcessed: number;
  runDate: string | null;
}

export function StatsCards({ leads, totalProcessed, runDate }: Props) {
  const top = leads.filter((l) => l.tier === "top").length;
  const qualified = leads.filter((l) => l.tier === "qualified").length;
  const warm = leads.filter((l) => l.tier === "warm").length;
  const highSeniority = leads.filter((l) => l.seniorityTier === "HIGH_SENIORITY").length;

  const cards = [
    { label: "Total Qualified", value: leads.length, sub: `from ${totalProcessed.toLocaleString()} scanned`, color: "bg-indigo-50 border-indigo-200 text-indigo-700" },
    { label: "Top Tier (≥70)", value: top, sub: "Immediate outreach", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
    { label: "Qualified (50–69)", value: qualified, sub: "Nurture sequence", color: "bg-blue-50 border-blue-200 text-blue-700" },
    { label: "Warm (30–49)", value: warm, sub: "Monitor & engage", color: "bg-amber-50 border-amber-200 text-amber-700" },
    { label: "Confirmed Senior", value: highSeniority, sub: "Title-verified execs", color: "bg-purple-50 border-purple-200 text-purple-700" },
  ];

  return (
    <div className="space-y-2">
      {runDate && (
        <p className="text-xs text-gray-400">
          Last run: {new Date(runDate).toLocaleString()}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-xl border p-4 ${c.color}`}>
            <div className="text-3xl font-bold">{c.value}</div>
            <div className="mt-0.5 text-sm font-medium">{c.label}</div>
            <div className="mt-1 text-xs opacity-70">{c.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
