"use client";

export interface Filters {
  tier: string;
  seniority: string;
  func: string;
  country: string;
  search: string;
}

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  totalShown: number;
  totalLeads: number;
  countries: { code: string; name: string }[];
}

export function FilterBar({ filters, onChange, totalShown, totalLeads, countries }: Props) {
  return (
    <div className="mm-card rounded-2xl px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-400">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search name, email, company, title…"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="w-56 rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-[#F15A29]/50 focus:outline-none focus:ring-1 focus:ring-[#F15A29]/40"
          />
        </div>

        <Select
          value={filters.tier}
          onChange={(v) => onChange({ ...filters, tier: v })}
          options={[
            { value: "", label: "All tiers" },
            { value: "top", label: "Top (≥70)" },
            { value: "qualified", label: "Qualified (50–69)" },
            { value: "warm", label: "Warm (20–49)" },
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

        <Select
          value={filters.func}
          onChange={(v) => onChange({ ...filters, func: v })}
          options={[
            { value: "", label: "All functions" },
            { value: "__budget__", label: "Budget functions (ICP)" },
            { value: "Marketing", label: "Marketing" },
            { value: "Sales", label: "Sales" },
            { value: "Brand", label: "Brand" },
            { value: "Business Development", label: "Business Development" },
            { value: "Strategy", label: "Strategy" },
            { value: "Product", label: "Product" },
            { value: "Insights/Research", label: "Insights / Research" },
          ]}
        />

        {countries.length > 0 && (
          <Select
            value={filters.country}
            onChange={(v) => onChange({ ...filters, country: v })}
            options={[
              { value: "", label: "All countries" },
              ...countries.map((c) => ({ value: c.code, label: c.name })),
            ]}
          />
        )}

        <span className="ml-auto rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
          Showing <span className="font-semibold text-[#F15A29]">{totalShown.toLocaleString()}</span> of {totalLeads.toLocaleString()}
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
      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-[#F15A29]/50 focus:outline-none focus:ring-1 focus:ring-[#F15A29]/40"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
