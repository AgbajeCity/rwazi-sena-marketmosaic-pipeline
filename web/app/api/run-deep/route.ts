import { NextRequest, NextResponse } from "next/server";
import { newDeepJob, runDeepChunk, jobToResult } from "@/lib/pipeline";
import { loadJob, saveJob } from "@/lib/job";
import { saveLeads, saveStatus } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Advance the chunked deep-scan job by one time-bounded slice.
//
// POST            → resume in-flight job, or start a new one if none exists
// POST ?restart=1 → discard any existing job and start fresh
// GET             → same as POST; used by Vercel Cron (which only sends GET)
//                   GET with a finished job is a no-op (returns done:true)
async function handle(req: NextRequest) {
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

    // Cron GET: if there's nothing to do, return immediately without starting a new job.
    if (req.method === "GET" && (!job || job.state === "done")) {
      return NextResponse.json({ ok: true, done: true, skipped: true });
    }

    // Don't let the browser loop and the cron advance the same job at once.
    if (job && job.state === "running" && job.lockedUntil && job.lockedUntil > Date.now()) {
      return NextResponse.json({ ok: true, busy: true, done: false, message: job.message });
    }

    if (!job || job.state === "done") job = newDeepJob();

    // Claim the lock for the duration of this chunk (plus a small buffer) and
    // persist it before doing any work, so a concurrent caller sees it.
    job.lockedUntil = Date.now() + 55_000;
    await saveJob(job);

    job = await runDeepChunk(job);
    job.lockedUntil = null;
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

export const GET = handle;
export const POST = handle;
