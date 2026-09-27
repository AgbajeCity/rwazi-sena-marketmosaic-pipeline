import {
  WEIGHT_OPEN_RATE, WEIGHT_CLICK_RATE, WEIGHT_TENURE, WEIGHT_SENIORITY,
  OPEN_RATE_TARGET, CLICK_RATE_TARGET,
  TENURE_MIN_DAYS, TENURE_MAX_DAYS,
  TIER_TOP, TIER_QUALIFIED, TIER_WARM,
} from "./config";
import { SeniorityTier } from "./seniority";

// createdMs: subscription creation time in epoch milliseconds
export function tenureScore(createdMs: number): number {
  if (!createdMs || isNaN(createdMs)) return 0;
  const days = (Date.now() - createdMs) / (1000 * 60 * 60 * 24);
  if (days < TENURE_MIN_DAYS) return 0;
  if (days >= TENURE_MAX_DAYS) return 1;
  return (days - TENURE_MIN_DAYS) / (TENURE_MAX_DAYS - TENURE_MIN_DAYS);
}

function seniorityScore(tier: SeniorityTier): number {
  switch (tier) {
    case "HIGH_SENIORITY": return 1;
    case "PROBABLE_SENIORITY": return 0.5;
    case "INFERRED": return 0.25;
    default: return 0;
  }
}

export function engagementScore(
  openRate: number,
  clickRate: number,
  createdMs: number,
  seniority: SeniorityTier,
): number {
  const openComponent = Math.min(openRate / OPEN_RATE_TARGET, 1);
  const clickComponent = Math.min(clickRate / CLICK_RATE_TARGET, 1);
  const tenureComponent = tenureScore(createdMs);
  const seniorityComponent = seniorityScore(seniority);
  return (
    openComponent * WEIGHT_OPEN_RATE +
    clickComponent * WEIGHT_CLICK_RATE +
    tenureComponent * WEIGHT_TENURE +
    seniorityComponent * WEIGHT_SENIORITY
  ) * 100;
}

export function leadTier(score: number): "top" | "qualified" | "warm" | "excluded" {
  if (score >= TIER_TOP) return "top";
  if (score >= TIER_QUALIFIED) return "qualified";
  if (score >= TIER_WARM) return "warm";
  return "excluded";
}
