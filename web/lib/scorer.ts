import {
  WEIGHT_OPEN_RATE, WEIGHT_CLICK_RATE, WEIGHT_TENURE,
  TENURE_MIN_DAYS, TENURE_MAX_DAYS,
  TIER_TOP, TIER_QUALIFIED, TIER_WARM,
} from "./config";

export function tenureScore(createdAt: string | null | undefined): number {
  if (!createdAt) return 0;
  const created = new Date(createdAt);
  if (isNaN(created.getTime())) return 0;
  const days = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
  if (days < TENURE_MIN_DAYS) return 0;
  if (days >= TENURE_MAX_DAYS) return 1;
  return (days - TENURE_MIN_DAYS) / (TENURE_MAX_DAYS - TENURE_MIN_DAYS);
}

export function engagementScore(
  openRate: number,
  clickRate: number,
  createdAt: string | null | undefined,
): number {
  const ts = tenureScore(createdAt);
  return (
    (openRate / 100) * WEIGHT_OPEN_RATE +
    (clickRate / 100) * WEIGHT_CLICK_RATE +
    ts * WEIGHT_TENURE
  ) * 100;
}

export function leadTier(score: number): "top" | "qualified" | "warm" | "excluded" {
  if (score >= TIER_TOP) return "top";
  if (score >= TIER_QUALIFIED) return "qualified";
  if (score >= TIER_WARM) return "warm";
  return "excluded";
}
