// Client-safe lead helpers shared by the dashboard table and the CSV export.
// Type-only import from pipeline is erased at build time, so this module pulls
// in no server-side code (safe to import from "use client" components).
import type { Lead } from "./pipeline";

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
