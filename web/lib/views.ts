// Per-visitor filter state and named saved views, persisted in localStorage so
// each person who opens the dashboard keeps their own cut of the list. There are
// no user accounts on this internal tool, so "per visitor" = per browser.

export interface Filters {
  tier: string;
  seniority: string;
  func: string;
  region: string;
  country: string;
  search: string;
}

export const DEFAULT_FILTERS: Filters = {
  tier: "",
  seniority: "",
  func: "",
  region: "",
  country: "",
  search: "",
};

export interface SavedView {
  id: string;
  name: string;
  filters: Filters;
}

const FILTERS_KEY = "sena.activeFilters";
const VIEWS_KEY = "sena.savedViews";

// True if any filter is set — used to show the Reset control and decide whether
// a "Save view" is meaningful.
export function hasActiveFilters(f: Filters): boolean {
  return Object.values(f).some((v) => v !== "");
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full / disabled — fail silently; filters still work in-memory.
  }
}

// Restore the last-used filters, merged onto defaults so older/partial stored
// shapes can't drop a field.
export function loadFilters(): Filters {
  return { ...DEFAULT_FILTERS, ...read<Partial<Filters>>(FILTERS_KEY, {}) };
}

export function saveFilters(filters: Filters): void {
  write(FILTERS_KEY, filters);
}

export function loadViews(): SavedView[] {
  const views = read<SavedView[]>(VIEWS_KEY, []);
  return Array.isArray(views) ? views : [];
}

export function saveViews(views: SavedView[]): void {
  write(VIEWS_KEY, views);
}

export function newViewId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
