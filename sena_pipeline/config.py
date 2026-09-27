"""
All pipeline configuration — thresholds, weights, field names, domain lists.
Change values here only; never hardcode in logic files.
"""

# ── Publication ───────────────────────────────────────────────────────────────
PUBLICATION_ID = "pub_422b220b-eb3d-48b7-8341-ba44f5e2cdc7"

# ── Scoring weights ────────────────────────────────────────────────────────────
# Original spec: open 0.35, click 0.40, recency 0.15, tenure 0.10
# Adjusted: last_engaged_date does not exist in beehiiv API.
# Recency weight redistributed: open +0.05, click +0.05, tenure +0.05.
WEIGHT_OPEN_RATE = 0.40
WEIGHT_CLICK_RATE = 0.45
WEIGHT_TENURE = 0.15

# ── Tenure thresholds (days) ───────────────────────────────────────────────────
TENURE_MIN_DAYS = 30      # below this → tenure_score = 0
TENURE_MAX_DAYS = 180     # at or above this → tenure_score = 1.0

# ── Lead tier thresholds ──────────────────────────────────────────────────────
TIER_TOP = 70
TIER_QUALIFIED = 50
TIER_WARM = 30
# below TIER_WARM → excluded

# ── Seniority keywords (case-insensitive substring match) ─────────────────────
SENIORITY_KEYWORDS = [
    "CEO", "CTO", "CFO", "CMO", "CPO", "CRO", "COO",
    "Founder", "Co-founder", "Cofounder",
    "President",
    "Managing Director",
    "VP", "Vice President", "SVP", "EVP",
    "Head of",
    "Director",
    "Principal",
    "Partner",
    "GM", "General Manager",
    "Senior Manager",
    "Senior Director",
]

# ── Consumer email domains (excluded from PROBABLE_SENIORITY) ─────────────────
CONSUMER_DOMAINS = {
    "gmail.com", "yahoo.com", "yahoo.co.uk", "yahoo.co.in",
    "hotmail.com", "hotmail.co.uk", "outlook.com", "outlook.co.uk",
    "icloud.com", "protonmail.com", "proton.me",
    "me.com", "live.com", "live.co.uk", "live.nl",
    "aol.com", "msn.com", "ymail.com",
    "mail.com", "gmx.com", "gmx.de", "gmx.net",
    "zoho.com", "fastmail.com", "fastmail.fm",
    "hey.com", "pm.me", "tutanota.com",
}

# ── Pagination ────────────────────────────────────────────────────────────────
LIST_PAGE_SIZE = 100          # max allowed by beehiiv API
MAX_CONCURRENT_PAGES = 5      # parallel list_subscriptions calls

# ── Enrichment limit ─────────────────────────────────────────────────────────
# Number of domain-filtered candidates to enrich with full stats (Pass 2).
# Increase for more complete scoring; decrease to stay within time budget.
# At ~3 calls/sec, 5000 enrichments ≈ 28 minutes; 2000 ≈ 11 minutes.
MAX_ENRICHMENT = 5000

# ── Rate limiting ─────────────────────────────────────────────────────────────
RATE_LIMIT_SLEEP_SECONDS = 5
MAX_RETRIES = 3

# ── Output ────────────────────────────────────────────────────────────────────
OUTPUT_DIR = "sena_pipeline/outputs"
STATE_FILE = "pipeline_state.json"

# ── Incremental mode ──────────────────────────────────────────────────────────
# Key in pipeline_state.json that records the last successful run timestamp
LAST_RUN_KEY = "last_run_completed_at"
LAST_PAGE_KEY = "last_completed_page"

# ── INFERRED tier: top N% of scored unverified subscribers ───────────────────
INFERRED_TOP_PERCENTILE = 5  # top 5%

# ── Custom field names (as returned in the custom_fields array) ───────────────
CF_JOB_TITLE = "job_title"
CF_COMPANY = "company"
CF_ROLE = "role"
CF_FIRST_NAME = "first_name"
CF_LAST_NAME = "last_name"
CF_FULL_NAME = "full_name"
