import { NextResponse } from "next/server";
import { PUBLICATION_ID, BEEHIIV_API_BASE } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const key = process.env.BEEHIIV_API_KEY;
  if (!key) return NextResponse.json({ error: "no api key" }, { status: 500 });
  const h = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

  try {
    // 1. Raw list response (first page)
    const listUrl = `${BEEHIIV_API_BASE}/publications/${PUBLICATION_ID}/subscriptions?status=active&limit=3&order_by=created&direction=asc`;
    const listRes = await fetch(listUrl, { headers: h });
    const listJson = await listRes.json();

    // 2. Grab first subscription id and enrich it with expand
    const first = listJson?.data?.[0] ?? listJson?.subscriptions?.[0];
    let detailJson: unknown = null;
    let detailUrl = "";
    if (first?.id) {
      detailUrl = `${BEEHIIV_API_BASE}/publications/${PUBLICATION_ID}/subscriptions/${first.id}?expand[]=stats&expand[]=custom_fields`;
      const detailRes = await fetch(detailUrl, { headers: h });
      detailJson = await detailRes.json();
    }

    return NextResponse.json({
      listStatus: listRes.status,
      listKeys: Object.keys(listJson ?? {}),
      listSample: listJson,
      detailUrl,
      detailJson,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
