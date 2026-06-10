import { CONSUMER_DOMAINS, MAX_ENRICHMENT, MAX_SCAN_PAGES } from "./config";
import {
  listSubscribersPage,
  extractOpenRate,
  extractClickRate,
  extractCustomField,
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

  log("Fetching subscribers...");

  // Fetch page 1 to discover total_pages, then fetch all pages in parallel
  const firstResp = await listSubscribersPage(1, 100);
  const totalPages = Math.min(firstResp.total_pages ?? 1, MAX_SCAN_PAGES);

  const allPages = [firstResp];
  if (totalPages > 1) {
    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) => listSubscribersPage(i + 2, 100))
    );
    allPages.push(...rest);
  }

  log(`Scoring ${totalPages * 100} subscribers...`);

  const leads: Lead[] = [];
  let totalScanned = 0;

  for (const resp of allPages) {
    for (const sub of resp.data) {
      totalScanned++;
      if (!isCorporate(sub.email)) continue;

      const openRate = extractOpenRate(sub);
      const clickRate = extractClickRate(sub);
      const jobTitle = extractCustomField(sub, "job_title") ?? extractCustomField(sub, "Job Title");
      const company = extractCustomField(sub, "company") ?? extractCustomField(sub, "Company");
      const role = extractCustomField(sub, "role");

      const seniority = classifySeniority(sub.email, jobTitle, role);
      if (seniority === "UNVERIFIED") continue;

      const score = engagementScore(openRate, clickRate, sub.created_at);
      const tier = leadTier(score);
      if (tier === "excluded") continue;

      const days = Math.floor((Date.now() - new Date(sub.created_at).getTime()) / (1000 * 60 * 60 * 24));

      leads.push({
        id: sub.id,
        email: sub.email,
        domain: domain(sub.email),
        company,
        jobTitle,
        seniorityTier: seniority,
        score: Math.round(score * 10) / 10,
        openRate,
        clickRate,
        tier,
        createdAt: sub.created_at,
        subscriptionDays: days,
      });
    }
  }

  leads.sort((a, b) => b.score - a.score);
  const topLeads = leads.slice(0, MAX_ENRICHMENT);

  log(`Done — ${topLeads.length} qualified leads from ${totalScanned} subscribers`);

  return {
    leads: topLeads,
    totalProcessed: totalScanned,
    runDate: new Date().toISOString(),
    durationMs: Date.now() - start,
  };
}
