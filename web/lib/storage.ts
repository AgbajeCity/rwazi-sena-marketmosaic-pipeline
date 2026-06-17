import { put, head } from "@vercel/blob";
import { PipelineResult } from "./pipeline";
import { ReadinessState, emptyState } from "./readiness";

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

async function fetchPrivateBlob(url: string): Promise<Response> {
  return fetch(url, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

export async function saveLeads(result: PipelineResult): Promise<void> {
  await put(LEADS_BLOB_KEY, JSON.stringify(result), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    token,
  });
}

export async function loadLeads(): Promise<PipelineResult | null> {
  try {
    const meta = await head(LEADS_BLOB_KEY, { token });
    if (!meta) return null;
    const res = await fetchPrivateBlob(meta.url);
    if (!res.ok) return null;
    return res.json() as Promise<PipelineResult>;
  } catch {
    return null;
  }
}

export async function saveStatus(status: RunStatus): Promise<void> {
  await put(STATUS_BLOB_KEY, JSON.stringify(status), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    token,
  });
}

export async function loadStatus(): Promise<RunStatus> {
  try {
    const meta = await head(STATUS_BLOB_KEY, { token });
    if (!meta) return defaultStatus();
    const res = await fetchPrivateBlob(meta.url);
    if (!res.ok) return defaultStatus();
    return res.json() as Promise<RunStatus>;
  } catch {
    return defaultStatus();
  }
}

function defaultStatus(): RunStatus {
  return { state: "idle", startedAt: null, finishedAt: null, message: "No run yet", leadCount: 0 };
}

// ── Launch-readiness state (shared team-wide, separate blob key) ──────────
const READINESS_BLOB_KEY = "sena-launch/readiness.json";

export async function saveReadiness(state: ReadinessState): Promise<void> {
  await put(READINESS_BLOB_KEY, JSON.stringify(state), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    token,
  });
}

export async function loadReadiness(): Promise<ReadinessState> {
  try {
    const meta = await head(READINESS_BLOB_KEY, { token });
    if (!meta) return emptyState();
    const res = await fetchPrivateBlob(meta.url);
    if (!res.ok) return emptyState();
    const parsed = (await res.json()) as Partial<ReadinessState>;
    return { ...emptyState(), ...parsed };
  } catch {
    return emptyState();
  }
}
