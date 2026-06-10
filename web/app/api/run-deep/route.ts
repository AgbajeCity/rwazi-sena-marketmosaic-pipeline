import { NextRequest, NextResponse } from "next/server";
import { newDeepJob, runDeepChunk, jobToResult } from "@/lib/pipeline";
import { loadJob, saveJob } from "@/lib/job";
import { saveLeads, saveStatus } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Advance the chunked deep-scan job by one time-bounded slice.
// POST            → resume the in-flight job (or start one if none/finished)
// POST ?restart=1 → discard any existing job and start fresh
export async function POST(req: NextRequest) {
  if (!process.env.BEEHIIV_API_KEY) {
    return NextResponse.json({ ok: false, error: "BEEHIIV_API_KEY is not set" }, { status: 500 });
  }
  const blobToken = process.env.SENA_BLOB_READ_WRITE_TOKEN ?? process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    return NextResponse.json({ ok: false, error: "Blob token is not set" }, { status: 500 });
  }

  const restart = req.nextUrl.searchParams.get("restart") === "1";

  try {
    let job = restart ? null : await loadJob();
    if (!job || job.state === "done") job = newDeepJob();

    job = await runDeepChunk(job);
    await saveJob(job);

    // Mirror progress into the shared status the dashboard already polls.
    await saveStatus({
      state: job.state === "done" ? "done" : "running",
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
      message: job.message,
      leadCount: job.leads.length,
    });

    // Publish leads as they accumulate so the table fills in live.
    await saveLeads(jobToResult(job));

    return NextResponse.json({
      ok: true,
      done: job.state === "done",
      totalScanned: job.totalScanned,
      enrichedCount: job.enrichedCount,
      pending: job.pending.length,
      leadCount: job.leads.length,
      message: job.message,
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
