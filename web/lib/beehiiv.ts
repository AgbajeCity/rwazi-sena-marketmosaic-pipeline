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
  created_at?: string;
  status: string;
}

export interface SubscriberStats {
  total_delivered?: number;
  total_unique_opened?: number;
  open_rate?: number;
  click_rate?: number;
}

export interface SubscriberDetail {
  id: string;
  email: string;
  created_at: string;
  status: string;
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

export async function listSubscribersPage(
  page: number,
  limit = 100,
): Promise<{ data: SubscriberListItem[]; total_results: number; page: number; total_pages: number }> {
  return apiFetch(`/publications/${PUBLICATION_ID}/subscriptions`, {
    status: "active",
    page: String(page),
    limit: String(limit),
    // oldest first — these subscribers have engagement history and tenure
    order_by: "created",
    direction: "asc",
  });
}

export async function getSubscription(subId: string): Promise<{ data: SubscriberDetail }> {
  return apiFetch(`/publications/${PUBLICATION_ID}/subscriptions/${subId}`, {
    expand: ["stats", "custom_fields"],
  });
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
