import {
  CONSUMER_DOMAINS,
  MAX_ENRICHMENT,
  MAX_SCAN_PAGES,
  CHUNK_BUDGET_MS,
  DEEP_ENRICH_MAX,
  DEEP_SCAN_MAX,
} from "./config";
import {
  listSubscribersPage,
  getSubscription,
  extractOpenRate,
  extractClickRate,
  extractCustomField,
  SubscriberListItem,
} from "./beehiiv";
import { engagementScore, leadTier } from "./scorer";
import { classifySeniority, classifyFunction, domain, SeniorityTier } from "./seniority";
import { JobState } from "./job";

export interface Lead {
  id: string;
  email: string;
  name: string | null;
  linkedinUrl: string | null;
  topics: string | null;
  domain: string;
  company: string | null;
  industry: string | null;
  jobTitle: string | null;
  func: string | null;
  seniorityTier: SeniorityTier;
  location: string | null;
  country: string | null;
  score: number;
  openRate: number;
  clickRate: number;
  tier: "top" | "qualified" | "warm" | "excluded";
  createdAt: string;
  subscriptionDays: number;
}

// Pull the ISO country code from beehiiv's "City, Region, CC" location string.
function parseCountry(location: string | null | undefined): string | null {
  if (!location) return null;
  const parts = location.split(",").map((s) => s.trim()).filter(Boolean);
  const last = parts[parts.length - 1];
  return last && /^[A-Za-z]{2}$/.test(last) ? last.toUpperCase() : null;
}

export interface PipelineResult {
  leads: Lead[];
  totalProcessed: number;
  runDate: string;
  durationMs: number;
}

export type ProgressCallback = (msg: string) => void;

function isCorporate(email: string): boolean {
  return !CONSUMER_DOMAINS.has(email.split("@")[1]?.toLowerCase() ?? "");
}

// Score one enriched subscriber detail into a Lead, or null if below threshold.
function scoreDetail(d: import("./beehiiv").SubscriberDetail): Lead | null {
  const openRate = extractOpenRate(d);
  const clickRate = extractClickRate(d);
  const jobTitle = extractCustomField(d, "job_title") ?? extractCustomField(d, "Job Title");
  const company = extractCustomField(d, "company") ?? extractCustomField(d, "Company");
  const role = extractCustomField(d, "role") ?? extractCustomField(d, "Role");
  // Industry: not collected at signup today, but consumed here so it lights up
  // automatically once an "industry" custom field is added to the beehiiv form.
  const industry = extractCustomField(d, "industry") ?? extractCustomField(d, "Industry");

  // Name + outreach fields Market Mosaic collects on signup (used by the
  // marketing/sales teams who consume these leads, not for scoring).
  const fullName = extractCustomField(d, "full_name");
  const firstLast = [extractCustomField(d, "first_name"), extractCustomField(d, "last_name")]
    .filter(Boolean)
    .join(" ");
  const name = fullName ?? (firstLast || null);
  const linkedinUrl = extractCustomField(d, "linkedin_profile");
  const topics =
    extractCustomField(d, "favorite_topics") ??
    extractCustomField(d, "market_mosaic_topics_you_want_to_see");

  const seniority = classifySeniority(d.email, jobTitle, role);
  const func = classifyFunction(jobTitle, role);
  const location = d.location ?? null;
  const country = parseCountry(d.location);
  const createdMs = (d.created ?? 0) * 1000;
  const score = engagementScore(openRate, clickRate, createdMs, seniority);
  const tier = leadTier(score);
  if (tier === "excluded") return null;

  const days = createdMs ? Math.floor((Date.now() - createdMs) / (1000 * 60 * 60 * 24)) : 0;
  return {
    id: d.id,
    email: d.email,
    name,
    linkedinUrl,
    topics,
    domain: domain(d.email),
    company,
    industry,
    jobTitle,
    func,
    seniorityTier: seniority,
    location,
    country,
    score: Math.round(score * 10) / 10,
    openRate: Math.round(openRate * 10) / 10,
    clickRate: Math.round(clickRate * 10) / 10,
    tier,
    createdAt: createdMs ? new Date(createdMs).toISOString() : new Date().toISOString(),
    subscriptionDays: days,
  };
}

export async function runPipeline(onProgress?: ProgressCallback): Promise<PipelineResult> {
  const start = Date.now();
  const log = (msg: string) => onProgress?.(msg);

  log("Pass 1: scanning subscriber list...");

  // Pass 1 — cursor-paginate to collect corporate-domain candidates
  const candidates: SubscriberListItem[] = [];
  let totalScanned = 0;
  let cursor: string | undefined;
  for (let p = 0; p < MAX_SCAN_PAGES; p++) {
    const resp = await listSubscribersPage(cursor, 100);
    totalScanned += resp.data.length;
    for (const sub of resp.data) {
      if (isCorporate(sub.email)) candidates.push(sub);
    }
    if (!resp.hasMore || !resp.nextCursor) break;
    cursor = resp.nextCursor;
  }

  const toEnrich = candidates.slice(0, MAX_ENRICHMENT);
  log(`Pass 2: enriching ${toEnrich.length} candidates...`);

  // Pass 2 — enrich with bounded concurrency (beehiiv ~180 req/min, 5 concurrent)
  const CONCURRENCY = 5;
  const details: (Awaited<ReturnType<typeof getSubscription>> | null)[] = new Array(toEnrich.length).fill(null);
  let next = 0;
  async function worker() {
    while (next < toEnrich.length) {
      const idx = next++;
      details[idx] = await getSubscription(toEnrich[idx].id).catch(() => null);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const leads: Lead[] = [];

  for (const result of details) {
    if (!result) continue;
    const lead = scoreDetail(result.data);
    if (lead) leads.push(lead);
  }

  leads.sort((a, b) => b.score - a.score);

  const enrichedCount = details.filter(Boolean).length;
  log(`Done — ${leads.length} leads from ${totalScanned} subscribers (${enrichedCount}/${toEnrich.length} enriched)`);

  return {
    leads,
    totalProcessed: totalScanned,
    runDate: new Date().toISOString(),
    durationMs: Date.now() - start,
  };
}

// ── Deep scan (chunked, resumable) ────────────────────────────────────────

// A fresh deep-scan job, ready for the first chunk.
export function newDeepJob(): JobState {
  return {
    state: "running",
    cursor: null,
    scanComplete: false,
    totalScanned: 0,
    pending: [],
    enrichedCount: 0,
    enrichTarget: DEEP_ENRICH_MAX,
    leads: [],
    startedAt: new Date().toISOString(),
    finishedAt: null,
    message: "Starting deep scan…",
    lockedUntil: null,
  };
}

// Drop duplicate leads by subscriber id (a restart or concurrent chunk could
// otherwise enrich the same subscriber twice).
function dedupeLeads(leads: Lead[]): Lead[] {
  const seen = new Set<string>();
  const out: Lead[] = [];
  for (const l of leads) {
    if (seen.has(l.id)) continue;
    seen.add(l.id);
    out.push(l);
  }
  return out;
}

// Advance a deep-scan job by one time-bounded chunk and return the new state.
// Spends the first half of the budget listing subscribers, the second half
// enriching corporate candidates — so progress is made on both fronts each call.
export async function runDeepChunk(job: JobState): Promise<JobState> {
  const deadline = Date.now() + CHUNK_BUDGET_MS;
  const scanCutoff = Date.now() + CHUNK_BUDGET_MS / 2;

  // Phase 1 — list subscribers until the scan cutoff (or base exhausted).
  const targetReached = () => job.pending.length + job.enrichedCount >= job.enrichTarget;
  while (
    !job.scanComplete &&
    !targetReached() &&
    Date.now() < scanCutoff &&
    (DEEP_SCAN_MAX === 0 || job.totalScanned < DEEP_SCAN_MAX)
  ) {
    const resp = await listSubscribersPage(job.cursor ?? undefined, 100);
    job.totalScanned += resp.data.length;
    for (const sub of resp.data) {
      if (isCorporate(sub.email) && !targetReached()) {
        job.pending.push({ id: sub.id, email: sub.email });
      }
    }
    if (!resp.hasMore || !resp.nextCursor) {
      job.scanComplete = true;
    } else {
      job.cursor = resp.nextCursor;
    }
  }
  // Enough candidates collected — no need to list the rest of the base.
  if (targetReached()) job.scanComplete = true;

  // Phase 2 — enrich pending candidates (5 concurrent) until the deadline.
  const CONCURRENCY = 5;
  while (job.pending.length > 0 && Date.now() < deadline) {
    const batch = job.pending.splice(0, CONCURRENCY);
    const results = await Promise.all(
      batch.map((c) => getSubscription(c.id).catch(() => null)),
    );
    for (const r of results) {
      if (!r) continue;
      job.enrichedCount += 1;
      const lead = scoreDetail(r.data);
      if (lead) job.leads.push(lead);
    }
  }

  // Done when the base is fully listed and no candidates remain to enrich.
  if (job.scanComplete && job.pending.length === 0) {
    job.state = "done";
    job.finishedAt = new Date().toISOString();
    job.leads = dedupeLeads(job.leads).sort((a, b) => b.score - a.score);
    job.message = `Completed — ${job.leads.length} leads from ${job.totalScanned.toLocaleString()} subscribers`;
  } else {
    const phase = job.scanComplete ? "Enriching" : "Scanning";
    job.message = `${phase}… ${job.totalScanned.toLocaleString()} scanned, ${job.enrichedCount.toLocaleString()} enriched, ${job.leads.length} leads so far`;
  }

  return job;
}

// Produce the dashboard-facing result from a finished (or in-flight) job.
export function jobToResult(job: JobState): PipelineResult {
  return {
    leads: dedupeLeads(job.leads).sort((a, b) => b.score - a.score),
    totalProcessed: job.totalScanned,
    runDate: job.finishedAt ?? job.startedAt,
    durationMs: 0,
  };
}
