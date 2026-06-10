import { put, head } from "@vercel/blob";
import { PipelineResult } from "./pipeline";

// Vercel connected the blob store with a custom prefix
const token = process.env.SENA_BLOB_READ_WRITE_TOKEN ?? process.env.BLOB_READ_WRITE_TOKEN;

const LEADS_BLOB_KEY = "sena-pipeline/leads-latest.json";
const STATUS_BLOB_KEY = "sena-pipeline/run-status.json";

export interface RunStatus {
  state: "idle" | "running" | "done" | "error";
  startedAt: string | null;
  finishedAt: string | null;
  message: string;
  leadCount: number;
}

export async function saveLeads(result: PipelineResult): Promise<void> {
  await put(LEADS_BLOB_KEY, JSON.stringify(result), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    token,
  });
}

export async function loadLeads(): Promise<PipelineResult | null> {
  try {
    const meta = await head(LEADS_BLOB_KEY, { token });
    if (!meta) return null;
    // For private blobs fetch via SDK using the token
    const res = await fetch(meta.url);
    if (!res.ok) return null;
    return res.json() as Promise<PipelineResult>;
  } catch {
    return null;
  }
}

export async function saveStatus(status: RunStatus): Promise<void> {
  await put(STATUS_BLOB_KEY, JSON.stringify(status), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    token,
  });
}

export async function loadStatus(): Promise<RunStatus> {
  try {
    const meta = await head(STATUS_BLOB_KEY, { token });
    if (!meta) return defaultStatus();
    const res = await fetch(meta.url);
    if (!res.ok) return defaultStatus();
    return res.json() as Promise<RunStatus>;
  } catch {
    return defaultStatus();
  }
}

function defaultStatus(): RunStatus {
  return { state: "idle", startedAt: null, finishedAt: null, message: "No run yet", leadCount: 0 };
}
