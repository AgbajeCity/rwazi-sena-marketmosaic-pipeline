import { put, head } from "@vercel/blob";
import { Lead } from "./pipeline";

const token = process.env.SENA_BLOB_READ_WRITE_TOKEN ?? process.env.BLOB_READ_WRITE_TOKEN;
const JOB_BLOB_KEY = "sena-pipeline/deep-job.json";

// A resumable, chunked scan of the full subscriber base.
// Each /api/run-deep call advances the job by one time-bounded chunk and
// persists state here, so a 129K scan survives the 60s function limit.
export interface JobState {
  state: "running" | "done" | "error";
  // Phase 1 — listing
  cursor: string | null;
  scanComplete: boolean;
  totalScanned: number;
  // corporate candidates discovered but not yet enriched
  pending: { id: string; email: string }[];
  // Phase 2 — enrichment
  enrichedCount: number;
  enrichTarget: number;
  // accumulated qualified leads (sorted at the end)
  leads: Lead[];
  startedAt: string;
  finishedAt: string | null;
  message: string;
  // Epoch ms until which a chunk is in flight. Prevents the browser loop and
  // the cron from advancing the same job concurrently. Null/past = free.
  lockedUntil: number | null;
}

async function fetchPrivateBlob(url: string): Promise<Response> {
  return fetch(url, { headers: token ? { authorization: `Bearer ${token}` } : {} });
}

export async function saveJob(job: JobState): Promise<void> {
  await put(JOB_BLOB_KEY, JSON.stringify(job), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    token,
  });
}

export async function loadJob(): Promise<JobState | null> {
  try {
    const meta = await head(JOB_BLOB_KEY, { token });
    if (!meta) return null;
    const res = await fetchPrivateBlob(meta.url);
    if (!res.ok) return null;
    return (await res.json()) as JobState;
  } catch {
    return null;
  }
}
