import { NextResponse } from "next/server";
import { listSubscribersPage, getSubscription, extractOpenRate, extractClickRate, extractCustomField } from "@/lib/beehiiv";
import { engagementScore, leadTier } from "@/lib/scorer";
import { classifySeniority } from "@/lib/seniority";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONSUMER = new Set(["gmail.com","yahoo.com","hotmail.com","outlook.com","icloud.com","aol.com","protonmail.com","me.com","live.com","msn.com","mail.com","inbox.com","gmx.com","ymail.com"]);
const isCorp = (e: string) => !CONSUMER.has(e.split("@")[1]?.toLowerCase() ?? "");

export async function GET() {
  try {
    const page = await listSubscribersPage(undefined, 100);
    const corp = page.data.filter((s) => isCorp(s.email)).slice(0, 5);

    const rows = [];
    for (const s of corp) {
      const det = await getSubscription(s.id).catch((e) => ({ err: String(e) } as never));
      const d = (det as { data?: unknown }).data as Parameters<typeof extractOpenRate>[0] & { created?: number; email?: string } | undefined;
      if (!d) { rows.push({ id: s.id, error: "no detail" }); continue; }
      const openRate = extractOpenRate(d);
      const clickRate = extractClickRate(d);
      const jobTitle = extractCustomField(d, "Job Title") ?? extractCustomField(d, "job_title");
      const seniority = classifySeniority(d.email ?? s.email, jobTitle, null);
      const createdMs = (d.created ?? 0) * 1000;
      const score = engagementScore(openRate, clickRate, createdMs, seniority);
      rows.push({
        email: d.email,
        openRate, clickRate, jobTitle, seniority,
        createdMs, score: Math.round(score * 10) / 10, tier: leadTier(score),
      });
    }

    return NextResponse.json({
      listCount: page.data.length,
      hasMore: page.hasMore,
      corporateFound: corp.length,
      rows,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
