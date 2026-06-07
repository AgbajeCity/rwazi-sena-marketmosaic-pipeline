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
  created_at: string;
  status: string;
}

export interface SubscriberDetail {
  id: string;
  email: string;
  created_at: string;
  status: string;
  custom_fields: { name: string; value: string }[];
  stats?: {
    email?: {
      open_rate?: number;
      click_rate?: number;
    };
  };
  // v2 flat fields
  open_rate?: number;
  click_rate?: number;
}

async function apiFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BEEHIIV_API_BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
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
    expand: "stats",
  });
}

export async function getSubscription(subId: string): Promise<{ data: SubscriberDetail }> {
  return apiFetch(`/publications/${PUBLICATION_ID}/subscriptions/${subId}`, {
    expand: "stats,custom_fields",
  });
}

export function extractOpenRate(detail: SubscriberDetail): number {
  // Try different shapes of the beehiiv response
  if (typeof detail.open_rate === "number") return detail.open_rate;
  if (detail.stats?.email?.open_rate != null) return detail.stats.email.open_rate;
  return 0;
}

export function extractClickRate(detail: SubscriberDetail): number {
  if (typeof detail.click_rate === "number") return detail.click_rate;
  if (detail.stats?.email?.click_rate != null) return detail.stats.email.click_rate;
  return 0;
}

export function extractCustomField(detail: SubscriberDetail, name: string): string | null {
  return detail.custom_fields?.find((f) => f.name === name)?.value ?? null;
}
