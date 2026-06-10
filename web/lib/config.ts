export const PUBLICATION_ID = "pub_422b220b-eb3d-48b7-8341-ba44f5e2cdc7";
export const BEEHIIV_API_BASE = "https://api.beehiiv.com/v2";

// Scoring weights (sum to 1.0)
export const WEIGHT_OPEN_RATE = 0.30;
export const WEIGHT_CLICK_RATE = 0.25;
export const WEIGHT_TENURE = 0.15;
export const WEIGHT_SENIORITY = 0.30;

// Engagement normalization — open/click rates that earn full marks
export const OPEN_RATE_TARGET = 50;  // 50% open rate = full open score
export const CLICK_RATE_TARGET = 10; // 10% click rate = full click score

// Lead tiers (match dashboard labels: Warm 20–49, Qualified 50–69, High-Priority ≥70)
export const TIER_TOP = 70;
export const TIER_QUALIFIED = 50;
export const TIER_WARM = 20;

// Tenure thresholds (days)
export const TENURE_MIN_DAYS = 30;
export const TENURE_MAX_DAYS = 180;

// Max corporate candidates to enrich with full engagement stats per run
export const MAX_ENRICHMENT = 20;

// Pages to fetch in parallel for Pass 1 candidate discovery (100 subs/page)
export const MAX_SCAN_PAGES = 5;

// ── Deep-scan (chunked background job) settings ───────────────────────────
// Wall-clock budget per chunk. Each /api/run-deep call does at most this much
// work then persists progress, staying well under Vercel's 60s function limit.
export const CHUNK_BUDGET_MS = 40_000;
// Max corporate candidates to enrich across the whole deep run. Enrichment is
// one API call each (beehiiv ~180 req/min), so this bounds total runtime/cost.
export const DEEP_ENRICH_MAX = 2000;
// Safety cap on total subscribers listed (0 = scan the entire base).
export const DEEP_SCAN_MAX = 0;

// Consumer email domains to exclude
export const CONSUMER_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com",
  "aol.com", "protonmail.com", "me.com", "live.com", "msn.com",
  "mail.com", "inbox.com", "gmx.com", "ymail.com",
]);

// Senior title keywords
export const SENIOR_TITLE_KEYWORDS = [
  "ceo", "cfo", "coo", "cto", "ciso", "cmo", "cpo", "president",
  "founder", "co-founder", "owner", "partner", "principal",
  "managing director", "executive director", "director", "head of",
  "vp ", "vice president", "svp", "evp", "avp",
  "chief", "general manager", "gm",
];
