export const PUBLICATION_ID = "pub_422b220b-eb3d-48b7-8341-ba44f5e2cdc7";
export const BEEHIIV_API_BASE = "https://api.beehiiv.com/v2";

// Scoring weights
export const WEIGHT_OPEN_RATE = 0.40;
export const WEIGHT_CLICK_RATE = 0.45;
export const WEIGHT_TENURE = 0.15;

// Lead tiers (match dashboard labels: Warm 30–49, Qualified 50–69, High-Priority ≥70)
export const TIER_TOP = 70;
export const TIER_QUALIFIED = 50;
export const TIER_WARM = 30;

// Tenure thresholds (days)
export const TENURE_MIN_DAYS = 30;
export const TENURE_MAX_DAYS = 180;

// Max corporate candidates to enrich with full engagement stats per run
export const MAX_ENRICHMENT = 75;

// Pages to fetch in parallel for Pass 1 candidate discovery (100 subs/page)
export const MAX_SCAN_PAGES = 20;

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
