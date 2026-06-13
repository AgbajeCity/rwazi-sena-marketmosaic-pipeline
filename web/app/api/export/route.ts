import { NextResponse } from "next/server";
import { loadLeads } from "@/lib/storage";
import seedLeads from "@/lib/seed-leads.json";
import { PipelineResult } from "@/lib/pipeline";
import { LEAD_SOURCE, recommendedAction } from "@/lib/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// CRM-ready export. Column order and naming are chosen so the file imports
// cleanly into Pipedrive / HubSpot (the sales + marketing CRMs these leads feed).
// `lead_source` keeps Market Mosaic leads attributable; `outreach_status` is left
// blank for the consuming team to fill in as they work the list.
const HEADERS = [
  "name",
  "email",
  "company",
  "job_title",
  "function",
  "seniority_tier",
  "linkedin_url",
  "score",
  "tier",
  "recommended_action",
  "open_rate_pct",
  "click_rate_pct",
  "subscriber_since",
  "subscription_days",
  "favorite_topics",
  "lead_source",
  "outreach_status",
];

function dateOnly(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export async function GET() {
  const result: PipelineResult = (await loadLeads()) ?? (seedLeads as unknown as PipelineResult);

  const rows = result.leads.map((l) => [
    l.name ?? "",
    l.email,
    l.company ?? "",
    l.jobTitle ?? "",
    l.func ?? "",
    l.seniorityTier,
    l.linkedinUrl ?? "",
    l.score,
    l.tier,
    recommendedAction(l.tier),
    l.openRate,
    l.clickRate,
    dateOnly(l.createdAt),
    l.subscriptionDays,
    l.topics ?? "",
    LEAD_SOURCE,
    "", // outreach_status — filled in by the consuming team
  ]);

  const csv = [HEADERS, ...rows]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const date = result.runDate ? dateOnly(result.runDate) : new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="sena_leads_${date}.csv"`,
    },
  });
}
