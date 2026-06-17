import { NextResponse } from "next/server";
import { runPipeline } from "@/lib/pipeline";
import { saveLeads, saveStatus } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  // Validate required env vars up front
  if (!process.env.BEEHIIV_API_KEY) {
    return NextResponse.json({ ok: false, error: "BEEHIIV_API_KEY is not set" }, { status: 500 });
  }
  const blobToken = process.env.SENA_BLOB_READ_WRITE_TOKEN ?? process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    return NextResponse.json({ ok: false, error: "Blob token (SENA_BLOB_READ_WRITE_TOKEN or BLOB_READ_WRITE_TOKEN) is not set" }, { status: 500 });
  }

  try {
    await saveStatus({
      state: "running",
      startedAt: new Date().toISOString(),
      finishedAt: null,
      message: "Pipeline is running…",
      leadCount: 0,
    });

    const result = await runPipeline(async (msg) => {
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

    return NextResponse.json({
      ok: true,
      leadCount: result.leads.length,
      totalProcessed: result.totalProcessed,
      durationMs: result.durationMs,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await saveStatus({
      state: "error",
      startedAt: null,
      finishedAt: new Date().toISOString(),
      message: `Error: ${msg}`,
      leadCount: 0,
    }).catch(() => {});
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
