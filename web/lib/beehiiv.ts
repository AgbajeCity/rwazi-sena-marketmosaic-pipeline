import { BEEHIIV_API_BASE, PUBLICATION_ID } from "./config";

const apiKey = () => {
  const key = process.env.BEEHIIV_API_KEY;
  if (!key) throw new Error("BEEHIIV_API_KEY env var is not set");
  return key;
};

const headers = () => ({
  Authorization: `Bearer ${apiKey()}`,
  "Content-Type": "application/json",
});

export interface SubscriberListItem {
  id: string;
  email: string;
  created: number; // epoch seconds
  status: string;
}

export interface SubscriberStats {
  total_sent?: number;
  total_received?: number;
  total_unique_opened?: number;
  total_clicked?: number;
  open_rate?: number;
  click_rate?: number;
}

export interface SubscriberDetail {
  id: string;
  email: string;
  created: number; // epoch seconds
  status: string;
  location?: string; // native beehiiv geolocation, e.g. "Skopje, Grad Skopje, MK"
  custom_fields?: { name: string; value: string }[];
  stats?: SubscriberStats;
}

type QueryValue = string | string[];

async function apiFetch<T>(path: string, params?: Record<string, QueryValue>): Promise<T> {
  const url = new URL(`${BEEHIIV_API_BASE}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (Array.isArray(v)) {
        // beehiiv v2 expects repeated array-style params, e.g. expand[]=stats
        v.forEach((item) => url.searchParams.append(`${k}[]`, item));
      } else {
        url.searchParams.set(k, v);
      }
    }
  }
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`beehiiv API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

interface RawListResponse {
  data: SubscriberListItem[];
  has_more?: boolean;
  next_cursor?: string | null;
}

export async function listSubscribersPage(
  cursor?: string,
  limit = 100,
): Promise<{ data: SubscriberListItem[]; hasMore: boolean; nextCursor: string | null }> {
  const params: Record<string, QueryValue> = {
    status: "active",
    limit: String(limit),
    // oldest first — these subscribers have engagement history and tenure
    order_by: "created",
    direction: "asc",
  };
  if (cursor) params.cursor = cursor;
  const raw = await apiFetch<RawListResponse>(`/publications/${PUBLICATION_ID}/subscriptions`, params);
  return {
    data: raw.data ?? [],
    hasMore: raw.has_more ?? false,
    nextCursor: raw.next_cursor ?? null,
  };
}

export async function getSubscription(subId: string): Promise<{ data: SubscriberDetail }> {
  // Response may be wrapped in `data` or returned flat — normalize to { data }
  const raw = await apiFetch<SubscriberDetail | { data: SubscriberDetail }>(
    `/publications/${PUBLICATION_ID}/subscriptions/${subId}`,
    { expand: ["stats", "custom_fields"] },
  );
  const data = "data" in raw && raw.data ? raw.data : (raw as SubscriberDetail);
  return { data };
}

type SubscriberLike = {
  stats?: SubscriberStats;
  custom_fields?: { name: string; value: string }[];
};

export function extractOpenRate(detail: SubscriberLike): number {
  return detail.stats?.open_rate ?? 0;
}

export function extractClickRate(detail: SubscriberLike): number {
  return detail.stats?.click_rate ?? 0;
}

export function extractCustomField(detail: SubscriberLike, name: string): string | null {
  return detail.custom_fields?.find((f) => f.name === name)?.value ?? null;
}
