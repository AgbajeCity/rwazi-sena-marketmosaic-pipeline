// Client-safe lead helpers shared by the dashboard table and the CSV export.
// Type-only import from pipeline is erased at build time, so this module pulls
// in no server-side code (safe to import from "use client" components).
import type { Lead } from "./pipeline";
import { BUDGET_FUNCTIONS } from "./config";

// Tag written onto every exported row so Market Mosaic leads stay attributable
// in Pipedrive/HubSpot instead of being drowned by cold-outreach contacts.
export const LEAD_SOURCE = "Market Mosaic — Sena Prospect Pipeline";

// Downstream action for each tier, framed for the real consumers of these leads:
// Sena early-user acquisition and the product-marketing webinar.
export function recommendedAction(tier: Lead["tier"]): string {
  switch (tier) {
    case "top":
      return "Invite to Sena early access + webinar";
    case "qualified":
      return "Add to webinar / Sena outreach";
    case "warm":
      return "Nurture via newsletter";
    default:
      return "—";
  }
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
// Three actionable cuts of the lead list, matching how the teams consume them.
export type Segment = "all" | "sena" | "webinar" | "upsell";

export const SEGMENTS: { id: Segment; label: string; description: string }[] = [
  { id: "all", label: "All leads", description: "Every qualified lead" },
  { id: "sena", label: "Sena early-users", description: "Senior, budget-function, high-engagement" },
  { id: "webinar", label: "Webinar speakers", description: "Confirmed-senior, top-engagement contacts" },
  { id: "upsell", label: "Subscription upsell", description: "Highly-engaged corporate subscribers" },
];

export function isSegment(value: string | null | undefined): value is Segment {
  return value === "all" || value === "sena" || value === "webinar" || value === "upsell";
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
    case "webinar":
      // Speaker / amplifier roster: confirmed-senior and most engaged.
      return lead.seniorityTier === "HIGH_SENIORITY" && lead.tier === "top";
    case "upsell":
      // Premium-subscription upsell: highly engaged, corporate (not unverified).
      return (
        (lead.tier === "top" || lead.tier === "qualified") &&
        lead.seniorityTier !== "UNVERIFIED"
      );
    case "all":
    default:
      return true;
  }
}
