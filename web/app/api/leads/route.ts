import { NextResponse } from "next/server";
import { loadLeads } from "@/lib/storage";
import { publicLead } from "@/lib/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The dashboard is open without a login, so subscriber emails are masked and
// LinkedIn links dropped before anything leaves the server.
export async function GET() {
  const result = await loadLeads();
  if (!result) {
    return NextResponse.json({ leads: [], totalProcessed: 0, runDate: null, durationMs: 0 });
  }
  return NextResponse.json({ ...result, leads: result.leads.map(publicLead) });
}
