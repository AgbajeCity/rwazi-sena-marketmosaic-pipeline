import { NextResponse } from "next/server";
import { saveStatus } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  await saveStatus({
    state: "idle",
    startedAt: null,
    finishedAt: null,
    message: "Reset by user",
    leadCount: 0,
  });
  return NextResponse.json({ ok: true });
}
