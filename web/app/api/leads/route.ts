import { NextResponse } from "next/server";
import { loadLeads } from "@/lib/storage";
import seedLeads from "@/lib/seed-leads.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const result = await loadLeads();
  // Fall back to seeded data if blob has no results yet
  return NextResponse.json(result ?? seedLeads);
}
