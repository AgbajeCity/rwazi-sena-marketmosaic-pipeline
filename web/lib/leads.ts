// Client-safe lead helpers shared by the dashboard table and the CSV export.
// Type-only import from pipeline is erased at build time, so this module pulls
// in no server-side code (safe to import from "use client" components).
import type { Lead } from "./pipeline";
import { BUDGET_FUNCTIONS } from "./config";

// Tag written onto every exported row so Market Mosaic leads stay attributable
// in Pipedrive/HubSpot instead of being drowned by cold-outreach contacts.
export const LEAD_SOURCE = "Market Mosaic — Sena Prospect Pipeline";

// Downstream action for each tier, framed for the real consumers of these
// leads: Sena early-user acquisition.
export function recommendedAction(tier: Lead["tier"]): string {
  switch (tier) {
    case "top":
      return "Invite to Sena early access";
    case "qualified":
      return "Add to Sena outreach";
    case "warm":
      return "Nurture via newsletter";
    default:
      return "—";
  }
}

// Derive a best-effort display name from an email local-part, e.g.
// "john.doe@acme.com" → "John Doe", "j_smith2@x.io" → "J Smith". Used as a
// fallback when the subscriber never filled in a name field.
export function nameFromEmail(email: string): string {
  const local = (email.split("@")[0] ?? "").replace(/\+.*/, "");
  if (!local) return "";
  const tokens = local
    .split(/[._\-]+/)
    .map((t) => t.replace(/\d+/g, ""))
    .filter(Boolean);
  return tokens
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())
    .join(" ");
}

// The name to show for a lead: a real name on file if present, otherwise one
// inferred from the email address.
export function displayName(lead: Pick<Lead, "name" | "email">): string {
  return lead.name?.trim() || nameFromEmail(lead.email);
}

// Render an ISO country code as a full country name via the built-in Intl data
// (works in both the browser and the Node export route — no static map needed).
export function countryName(code: string | null | undefined): string {
  if (!code) return "";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

// ── Export segments ───────────────────────────────────────────────────────
// Actionable cuts of the lead list, matching how the teams consume them.
export type Segment = "all" | "sena" | "upsell";

export const SEGMENTS: { id: Segment; label: string; description: string }[] = [
  { id: "all", label: "All leads", description: "Every qualified lead" },
  { id: "sena", label: "Sena early-users", description: "Senior, budget-function, high-engagement" },
  { id: "upsell", label: "Rwazi monetisation", description: "High-engagement corporate contacts for Sena & AI product sales" },
];

export function isSegment(value: string | null | undefined): value is Segment {
  return value === "all" || value === "sena" || value === "upsell";
}

// Whether a lead belongs in a given segment.
export function inSegment(lead: Lead, segment: Segment): boolean {
  switch (segment) {
    case "sena":
      // Sena early-user acquisition: senior decision-makers in budget-holding
      // functions with real engagement (top/qualified tiers).
      return (
        (lead.tier === "top" || lead.tier === "qualified") &&
        (lead.seniorityTier === "HIGH_SENIORITY" || lead.seniorityTier === "PROBABLE_SENIORITY") &&
        !!lead.func &&
        BUDGET_FUNCTIONS.has(lead.func)
      );
    case "upsell":
      // Rwazi enterprise monetisation: high-engagement corporate contacts for Sena & AI product sales.
      return (
        (lead.tier === "top" || lead.tier === "qualified") &&
        lead.seniorityTier !== "UNVERIFIED"
      );
    case "all":
    default:
      return true;
  }
}
