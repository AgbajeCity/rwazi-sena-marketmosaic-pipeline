import { NextResponse } from "next/server";
import { loadStatus } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const status = await loadStatus();
  return NextResponse.json(status);
}
