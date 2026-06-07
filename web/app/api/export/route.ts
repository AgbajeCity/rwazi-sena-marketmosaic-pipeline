import { NextResponse } from "next/server";
import { loadLeads } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const result = await loadLeads();
  if (!result) {
    return new NextResponse("No data available", { status: 404 });
  }

  const headers = [
    "email", "domain", "company", "job_title", "seniority_tier",
    "score", "open_rate_pct", "click_rate_pct", "tier",
    "subscription_days", "created_at",
  ];

  const rows = result.leads.map((l) => [
    l.email,
    l.domain,
    l.company ?? "",
    l.jobTitle ?? "",
    l.seniorityTier,
    l.score,
    l.openRate,
    l.clickRate,
    l.tier,
    l.subscriptionDays,
    l.createdAt,
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const date = new Date(result.runDate).toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="sena_leads_${date}.csv"`,
    },
  });
}
