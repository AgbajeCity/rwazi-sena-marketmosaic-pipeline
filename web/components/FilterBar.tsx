"use client";

export interface Filters {
  tier: string;
  seniority: string;
  search: string;
}

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  totalShown: number;
  totalLeads: number;
}

export function FilterBar({ filters, onChange, totalShown, totalLeads }: Props) {
  return (
    <div className="sena-card rounded-2xl border border-white/[0.07] px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-500">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search email or domain…"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="w-56 rounded-lg border border-white/10 bg-white/[0.03] py-2 pl-9 pr-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-[#7df59e]/40 focus:outline-none focus:ring-1 focus:ring-[#7df59e]/40"
          />
        </div>

        <Select
          value={filters.tier}
          onChange={(v) => onChange({ ...filters, tier: v })}
          options={[
            { value: "", label: "All tiers" },
            { value: "top", label: "Top (≥70)" },
            { value: "qualified", label: "Qualified (50–69)" },
            { value: "warm", label: "Warm (30–49)" },
          ]}
        />

        <Select
          value={filters.seniority}
          onChange={(v) => onChange({ ...filters, seniority: v })}
          options={[
            { value: "", label: "All seniority" },
            { value: "HIGH_SENIORITY", label: "Confirmed senior" },
            { value: "PROBABLE_SENIORITY", label: "Corporate domain" },
            { value: "INFERRED", label: "Inferred" },
          ]}
        />

        <span className="ml-auto rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-zinc-400">
          Showing <span className="text-[#7df59e]">{totalShown.toLocaleString()}</span> of {totalLeads.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

function Select({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-200 focus:border-[#7df59e]/40 focus:outline-none focus:ring-1 focus:ring-[#7df59e]/40 [&>option]:bg-[#14141e] [&>option]:text-zinc-200"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
