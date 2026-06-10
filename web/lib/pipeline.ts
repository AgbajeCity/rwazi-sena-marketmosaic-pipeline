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

  // Fetch page 1 to get total_pages, then fetch all remaining pages in parallel
  const firstResp = await listSubscribersPage(1, 100);
  const totalPages = Math.min(firstResp.total_pages ?? 1, MAX_SCAN_PAGES);

  const allPages = [firstResp];
  if (totalPages > 1) {
    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) => listSubscribersPage(i + 2, 100))
    );
    allPages.push(...rest);
  }

  const candidates: SubscriberListItem[] = [];
  let totalScanned = 0;
  for (const resp of allPages) {
    totalScanned += resp.data.length;
    for (const sub of resp.data) {
      if (isCorporate(sub.email)) candidates.push(sub);
    }
  }

  const toEnrich = candidates.slice(0, MAX_ENRICHMENT);
  log(`Pass 2: enriching ${toEnrich.length} candidates in parallel...`);

  // Enrich in batches of 10 to avoid beehiiv rate limits
  const details: (Awaited<ReturnType<typeof getSubscription>> | null)[] = [];
  const BATCH = 10;
  for (let i = 0; i < toEnrich.length; i += BATCH) {
    const batch = toEnrich.slice(i, i + BATCH);
    const results = await Promise.all(batch.map((s) => getSubscription(s.id).catch(() => null)));
    details.push(...results);
  }

  const leads: Lead[] = [];

  for (const result of details) {
    if (!result) continue;
    const d = result.data;
    const openRate = extractOpenRate(d);
    const clickRate = extractClickRate(d);
    const jobTitle = extractCustomField(d, "job_title") ?? extractCustomField(d, "Job Title");
    const company = extractCustomField(d, "company") ?? extractCustomField(d, "Company");
    const role = extractCustomField(d, "role");

    const seniority = classifySeniority(d.email, jobTitle, role);

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

  leads.sort((a, b) => b.score - a.score);

  // Debug: show sample scores to diagnose zero-lead issue
  const sample = details.slice(0, 3).map(r => r ? `${r.data.email} open=${extractOpenRate(r.data)} click=${extractClickRate(r.data)}` : "null").join(" | ");
  log(`Done — ${leads.length} leads from ${totalScanned} subscribers. Sample: ${sample}`);

  return {
    leads,
    totalProcessed: totalScanned,
    runDate: new Date().toISOString(),
    durationMs: Date.now() - start,
  };
}
