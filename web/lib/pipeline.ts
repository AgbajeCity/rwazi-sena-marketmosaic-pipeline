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

  const candidates: SubscriberListItem[] = [];
  let page = 1;
  let totalPages = 1;
  let totalScanned = 0;

  while (page <= totalPages && page <= MAX_SCAN_PAGES && candidates.length < MAX_ENRICHMENT) {
    const resp = await listSubscribersPage(page, 100);
    totalPages = resp.total_pages ?? 1;
    totalScanned += resp.data.length;

    for (const sub of resp.data) {
      if (isCorporate(sub.email)) candidates.push(sub);
    }

    log(`  Page ${page}/${totalPages} — ${totalScanned} scanned, ${candidates.length} corporate candidates`);
    page++;

    if (candidates.length >= MAX_ENRICHMENT) break;
  }

  const toEnrich = candidates.slice(0, MAX_ENRICHMENT);
  log(`Pass 2: enriching ${toEnrich.length} candidates...`);

  const leads: Lead[] = [];
  const BATCH = 20;

  for (let i = 0; i < toEnrich.length; i += BATCH) {
    const batch = toEnrich.slice(i, i + BATCH);
    const details = await Promise.all(
      batch.map((s) => getSubscription(s.id).catch(() => null)),
    );

    for (const result of details) {
      if (!result) continue;
      const d = result.data;
      const openRate = extractOpenRate(d);
      const clickRate = extractClickRate(d);
      const jobTitle = extractCustomField(d, "job_title") ?? extractCustomField(d, "Job Title");
      const company = extractCustomField(d, "company") ?? extractCustomField(d, "Company");
      const role = extractCustomField(d, "role");

      const seniority = classifySeniority(d.email, jobTitle, role);
      if (seniority === "UNVERIFIED") continue;

      const score = engagementScore(openRate, clickRate, d.created_at);
      const tier = leadTier(score);
      if (tier === "excluded") continue;

      const days = Math.floor((Date.now() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24));

      leads.push({
        id: d.id,
        email: d.email,
        domain: domain(d.email),
        company,
        jobTitle,
        seniorityTier: seniority,
        score: Math.round(score * 10) / 10,
        openRate,
        clickRate,
        tier,
        createdAt: d.created_at,
        subscriptionDays: days,
      });
    }

    log(`  Enriched ${Math.min(i + BATCH, toEnrich.length)}/${toEnrich.length} — ${leads.length} qualified so far`);
  }

  leads.sort((a, b) => b.score - a.score);

  return {
    leads,
    totalProcessed: totalScanned,
    runDate: new Date().toISOString(),
    durationMs: Date.now() - start,
  };
}
