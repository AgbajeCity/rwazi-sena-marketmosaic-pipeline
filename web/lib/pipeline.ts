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

  // Fetch page 1 to discover total_pages, then fetch remaining pages in parallel
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

  log(`Pass 1 done — ${totalScanned} scanned, ${candidates.length} corporate candidates`);

  const toEnrich = candidates.slice(0, MAX_ENRICHMENT);
  log(`Pass 2: enriching ${toEnrich.length} candidates in parallel...`);

  // Enrich all candidates concurrently
  const details = await Promise.all(
    toEnrich.map((s) => getSubscription(s.id).catch(() => null))
  );

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

  log(`Pass 2 done — ${leads.length} qualified leads`);

  leads.sort((a, b) => b.score - a.score);

  return {
    leads,
    totalProcessed: totalScanned,
    runDate: new Date().toISOString(),
    durationMs: Date.now() - start,
  };
}
