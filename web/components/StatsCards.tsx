"use client";

import { Lead } from "@/lib/pipeline";

interface Props {
  leads: Lead[];
  totalProcessed: number;
  runDate: string | null;
}

function UsersIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export function StatsCards({ leads, totalProcessed, runDate }: Props) {
  const top = leads.filter((l) => l.tier === "top").length;
  const qualified = leads.filter((l) => l.tier === "qualified").length;
  const warm = leads.filter((l) => l.tier === "warm").length;
  const highSeniority = leads.filter((l) => l.seniorityTier === "HIGH_SENIORITY").length;

  const cards = [
    {
      label: "Total Prospects",
      value: leads.length,
      sub: `from ${totalProcessed.toLocaleString()} scanned`,
      accent: "text-[#F15A29]",
      ring: "border-[#F15A29]/20 bg-[#fef0eb]",
      icon: <UsersIcon />,
    },
    {
      label: "High-Priority (≥70)",
      value: top,
      sub: "Book a tailored demo",
      accent: "text-emerald-600",
      ring: "border-emerald-500/20 bg-emerald-50",
      icon: <StarIcon />,
    },
    {
      label: "Qualified (50–69)",
      value: qualified,
      sub: "Decision-ready nurture",
      accent: "text-sky-600",
      ring: "border-sky-500/20 bg-sky-50",
      icon: <CheckCircleIcon />,
    },
    {
      label: "Warm (20–49)",
      value: warm,
      sub: "Monitor market signals",
      accent: "text-amber-600",
      ring: "border-amber-500/20 bg-amber-50",
      icon: <FlameIcon />,
    },
    {
      label: "Senior Executives",
      value: highSeniority,
      sub: "C-suite & VP-level",
      accent: "text-violet-600",
      ring: "border-violet-500/20 bg-violet-50",
      icon: <ShieldIcon />,
    },
  ];

  return (
    <div className="space-y-3">
      {runDate && (
        <p className="text-xs text-zinc-500">
          Last run: <span className="font-medium text-zinc-700">{new Date(runDate).toLocaleString()}</span>
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <div
            key={c.label}
            className="mm-card rounded-2xl p-4 transition-shadow hover:shadow-md"
          >
            <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl border ${c.ring} ${c.accent}`}>
              {c.icon}
            </div>
            <div className={`text-3xl font-bold tracking-tight ${c.accent}`}>{c.value.toLocaleString()}</div>
            <div className="mt-1 text-sm font-medium text-zinc-800">{c.label}</div>
            <div className="mt-0.5 text-xs text-zinc-500">{c.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
