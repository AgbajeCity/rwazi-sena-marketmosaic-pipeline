"use client";

import { useEffect, useRef, useState } from "react";
import { REGIONS } from "@/lib/regions";
import { Filters, SavedView, hasActiveFilters } from "@/lib/views";

export type { Filters } from "@/lib/views";

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  totalShown: number;
  totalLeads: number;
  countries: { code: string; name: string }[];
  savedViews: SavedView[];
  onSaveView: (name: string) => void;
  onApplyView: (view: SavedView) => void;
  onDeleteView: (id: string) => void;
  onReset: () => void;
}

export function FilterBar({
  filters,
  onChange,
  totalShown,
  totalLeads,
  countries,
  savedViews,
  onSaveView,
  onApplyView,
  onDeleteView,
  onReset,
}: Props) {
  const active = hasActiveFilters(filters);
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
            value={filters.region}
            onChange={(v) => onChange({ ...filters, region: v })}
            options={[
              { value: "", label: "All regions" },
              { value: "__emerging__", label: "Emerging markets" },
              ...REGIONS.map((r) => ({ value: r, label: r })),
            ]}
          />
        )}

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

        <SavedViewsMenu
          savedViews={savedViews}
          canSave={active}
          onSaveView={onSaveView}
          onApplyView={onApplyView}
          onDeleteView={onDeleteView}
        />

        {active && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Reset
          </button>
        )}

        <span className="ml-auto rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
          Showing <span className="font-semibold text-[#F15A29]">{totalShown.toLocaleString()}</span> of {totalLeads.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// Per-visitor saved views: save the current filter combination under a name,
// then recall or delete it later. Backed by localStorage in the parent.
function SavedViewsMenu({
  savedViews,
  canSave,
  onSaveView,
  onApplyView,
  onDeleteView,
}: {
  savedViews: SavedView[];
  canSave: boolean;
  onSaveView: (name: string) => void;
  onApplyView: (view: SavedView) => void;
  onDeleteView: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSaveView(trimmed);
    setName("");
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-50"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
        Views
        {savedViews.length > 0 && (
          <span className="rounded-full bg-zinc-100 px-1.5 text-[11px] font-semibold text-zinc-500">{savedViews.length}</span>
        )}
        <svg className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 z-20 mt-2 w-72 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
          {savedViews.length > 0 ? (
            <ul className="max-h-60 overflow-y-auto py-1">
              {savedViews.map((v) => (
                <li key={v.id} className="group flex items-center justify-between gap-2 px-2 hover:bg-zinc-50">
                  <button
                    onClick={() => { onApplyView(v); setOpen(false); }}
                    className="flex-1 truncate px-2 py-2 text-left text-sm font-medium text-zinc-800"
                    title={v.name}
                  >
                    {v.name}
                  </button>
                  <button
                    onClick={() => onDeleteView(v.id)}
                    title="Delete view"
                    className="shrink-0 rounded p-1 text-zinc-300 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-xs text-zinc-500">No saved views yet. Set some filters, then save them here.</p>
          )}
          <div className="border-t border-zinc-100 p-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
                placeholder={canSave ? "Name this view…" : "Set filters first"}
                disabled={!canSave}
                className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-[#F15A29]/50 focus:outline-none focus:ring-1 focus:ring-[#F15A29]/40 disabled:bg-zinc-50 disabled:text-zinc-400"
              />
              <button
                onClick={submit}
                disabled={!canSave || !name.trim()}
                className="shrink-0 rounded-lg bg-[#F15A29] px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#d94d22] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
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
