import { put, head, getDownloadUrl } from "@vercel/blob";
import { PipelineResult } from "./pipeline";

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
  });
}

export async function loadLeads(): Promise<PipelineResult | null> {
  try {
    const meta = await head(LEADS_BLOB_KEY);
    if (!meta) return null;
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
  });
}

export async function loadStatus(): Promise<RunStatus> {
  try {
    const meta = await head(STATUS_BLOB_KEY);
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
