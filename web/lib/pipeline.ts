import { CONSUMER_DOMAINS, MAX_ENRICHMENT, MAX_SCAN_PAGES } from "./config";
import {
  listSubscribersPage,
  getSubscription,
  extractOpenRate,
  extractClickRate,
  extractCustomField,
  SubscriberListItem,
} from "./beehiiv";
import { engagementScore, leadTier } from "./scorer";
import { classifySeniority, domain, SeniorityTier } from "./seniority";

export interface Lead {
  id: string;
  email: string;
  domain: string;
  company: string | null;
  jobTitle: string | null;
  seniorityTier: SeniorityTier;
  score: number;
  openRate: number;
  clickRate: number;
  tier: "top" | "qualified" | "warm" | "excluded";
  createdAt: string;
  subscriptionDays: number;
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
    const d = result.data;
    const openRate = extractOpenRate(d);
    const clickRate = extractClickRate(d);
    const jobTitle = extractCustomField(d, "Job Title") ?? extractCustomField(d, "job_title");
    const company = extractCustomField(d, "Company") ?? extractCustomField(d, "company");
    const role = extractCustomField(d, "Role") ?? extractCustomField(d, "role");

    const seniority = classifySeniority(d.email, jobTitle, role);

    const createdMs = (d.created ?? 0) * 1000;
    const score = engagementScore(openRate, clickRate, createdMs, seniority);
    const tier = leadTier(score);
    if (tier === "excluded") continue;

    const days = createdMs ? Math.floor((Date.now() - createdMs) / (1000 * 60 * 60 * 24)) : 0;

    leads.push({
      id: d.id,
      email: d.email,
      domain: domain(d.email),
      company,
      jobTitle,
      seniorityTier: seniority,
      score: Math.round(score * 10) / 10,
      openRate: Math.round(openRate * 10) / 10,
      clickRate: Math.round(clickRate * 10) / 10,
      tier,
      createdAt: createdMs ? new Date(createdMs).toISOString() : new Date().toISOString(),
      subscriptionDays: days,
    });
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
