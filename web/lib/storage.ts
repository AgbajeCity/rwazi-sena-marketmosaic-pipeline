import { put, head } from "@vercel/blob";
import { ReadinessState, emptyState } from "./readiness";

// Shared, team-wide launch-readiness state lives in a single private blob so
// everyone working the gates sees the same progress. Last write wins — fine for
// a small launch team. Falls back to in-memory defaults if the blob is empty or
// unreachable (e.g. before the first save, or if the token is missing locally).
const token = process.env.SENA_BLOB_READ_WRITE_TOKEN ?? process.env.BLOB_READ_WRITE_TOKEN;

const READINESS_BLOB_KEY = "sena-launch/readiness.json";

async function fetchPrivateBlob(url: string): Promise<Response> {
  return fetch(url, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
}

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
    // Merge onto defaults so a partial/older shape can never drop a field.
    return { ...emptyState(), ...parsed };
  } catch {
    return emptyState();
  }
}
