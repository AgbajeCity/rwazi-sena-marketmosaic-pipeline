import { NextResponse } from "next/server";
import { loadLeads } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const result = await loadLeads();
  if (!result) {
    return NextResponse.json({ leads: [], totalProcessed: 0, runDate: null });
  }
  return NextResponse.json(result);
}
