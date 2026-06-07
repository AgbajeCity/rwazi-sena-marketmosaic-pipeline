import { NextResponse } from "next/server";
import { runPipeline } from "@/lib/pipeline";
import { saveLeads, saveStatus } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  // Mark as running immediately
  await saveStatus({
    state: "running",
    startedAt: new Date().toISOString(),
    finishedAt: null,
    message: "Pipeline is running…",
    leadCount: 0,
  });

  try {
    const result = await runPipeline(async (msg) => {
      // Update status message periodically so polling UI shows progress
      await saveStatus({
        state: "running",
        startedAt: new Date().toISOString(),
        finishedAt: null,
        message: msg,
        leadCount: 0,
      }).catch(() => {});
    });

    await saveLeads(result);
    await saveStatus({
      state: "done",
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      message: `Completed — ${result.leads.length} leads qualified from ${result.totalProcessed} subscribers`,
      leadCount: result.leads.length,
    });

    return NextResponse.json({ ok: true, leadCount: result.leads.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await saveStatus({
      state: "error",
      startedAt: null,
      finishedAt: new Date().toISOString(),
      message: `Error: ${msg}`,
      leadCount: 0,
    });
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
