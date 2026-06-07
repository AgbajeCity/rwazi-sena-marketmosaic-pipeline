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
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="text"
        placeholder="Search email or domain…"
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56"
      />

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

      <span className="ml-auto text-xs text-gray-400">
        Showing {totalShown} of {totalLeads}
      </span>
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
      className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
