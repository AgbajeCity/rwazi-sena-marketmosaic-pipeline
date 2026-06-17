# Sena Pipeline — Implementation Plan
_Written: 2026-06-07, based on Phase 1 exploration_

---

## 1. beehiiv MCP Tool Calls & Order

### Pass 1 — Full subscriber list scan
```
for page in 1..1291:
    list_subscriptions(publication_id, status="active", per_page=100, page=page)
```
Collects: subscriber_id, email, subscribed_on. Cost: ~1,291 calls.

### Pass 2 — Enrichment of domain-filtered candidates
```
for sub_id in domain_filtered_candidates[:MAX_ENRICHMENT]:
    get_subscription(sub_id)
```
Collects: open_rate, click_rate, custom_fields (job_title, company), updated_at. Cost: configurable (default 5,000).

### Incremental mode
```
list_subscriptions(..., subscribed_after=last_run_timestamp)
```
Then enrich all results (small set).

---

## 2. Pagination Strategy

- `list_subscriptions` max 100/page; iterate until `page > total_pages`
- Write `pipeline_state.json` after each completed page (resumable)
- Rate-limit handling: on HTTP 429, sleep 5s, retry up to 3 times
- Parallel pages: fetch up to 5 pages concurrently using `asyncio` / `ThreadPoolExecutor` to stay within time budget

---

## 3. Available Fields vs Assumed

| Field | Available | Source | Notes |
|-------|-----------|--------|-------|
| subscriber_id | ✅ | list | |
| email | ✅ | list | |
| subscribed_on / created_at | ✅ | list + get | |
| open_rate | ✅ | get only | 0–100 pct, NOT 0–1 |
| click_rate | ✅ | get only | 0–100 pct |
| total_delivered | ✅ | get only | |
| last_engaged_date | ❌ | — | Removed from model |
| job_title | ✅ (sparse) | get custom_fields | Rarely populated |
| company | ✅ (sparse) | get custom_fields | Rarely populated |
| location | ✅ | get only | City/region string |
| updated_at | ✅ | get only | Used as recency proxy |

---

## 4. Adjusted Scoring Model

```python
engagement_score = (
    min(open_rate / 100.0, 1.0)  * 0.40   # was 0.35
  + min(click_rate / 100.0, 1.0) * 0.45   # was 0.40
  + tenure_score(created_at)     * 0.15   # was 0.10
) * 100
```

**Recency removed** (no last_engaged_date). Weights redistributed: open +0.05, click +0.05, tenure keeps 0.15 (was 0.10). Total still = 1.0.

**Tenure score:**
- < 30 days → 0.0
- 30–180 days → linear scale 0.0–1.0
- > 180 days → 1.0

**Tier thresholds** (unchanged):
- Top: ≥ 70
- Qualified: 50–69
- Warm: 30–49
- Exclude: < 30

---

## 5. Seniority Detection Strategy

Applied to enriched subscribers only (Pass 2 set). Three tiers, first match wins:

**HIGH_SENIORITY** — custom field `job_title` or `role` matches any of:
`CEO, CTO, CFO, CMO, CPO, CRO, COO, Founder, Co-founder, President, Managing Director, VP, Vice President, SVP, EVP, Head of, Director, Principal, Partner, GM, General Manager, Senior Manager, Senior Director`
Case-insensitive substring match.

**PROBABLE_SENIORITY** — non-consumer email domain (exclude: gmail, yahoo, hotmail, outlook, icloud, protonmail, me.com, live.com, aol.com, msn.com, ymail.com, mail.com, gmx.com, zoho.com, fastmail.com, hey.com)

**UNVERIFIED** — consumer domain + no title. Include only if engagement score is in top 5% of all scored subscribers. Tag lead_tier as "INFERRED".

---

## 6. Project File Structure

```
sena_pipeline/
├── CLAUDE.md          (also at repo root)
├── README.md
├── requirements.txt
├── config.py          — all thresholds, weights, field names, excluded domains
├── beehiiv_client.py  — MCP tool calls, pagination, retry, state persistence
├── scorer.py          — engagement scoring functions
├── seniority.py       — seniority/role detection
├── pipeline.py        — main orchestrator: fetch → score → filter → output
├── outputs.py         — CSV, markdown report, Slack message generation
├── run.py             — CLI entry point
└── tests/
    ├── test_scorer.py
    ├── test_seniority.py
    ├── test_pipeline.py
    └── test_outputs.py
outputs/               (created at runtime, committed after live run)
pipeline_state.json    (created at runtime)
```

---

## 7. Test Strategy

### test_scorer.py — unit tests
- 50% open, 20% click, 200 days old → score ≈ 77 (new formula: 0.5×0.4 + 0.2×0.45 + 1.0×0.15 = 0.20 + 0.09 + 0.15 = 0.44 × 100 = 44... wait let me recalculate)
  - Actually: (0.50 × 0.40) + (0.20 × 0.45) + (1.0 × 0.15) = 0.20 + 0.09 + 0.15 = 0.44 → score = 44
  - Note: spec said "≈76" under old formula. New formula gives 44. Tests will use new formula values.
- 0% open, 0% click → score = 0
- 100% open, 100% click, 365+ days → score = 100
- Subscriber 29 days old → tenure_score = 0
- Tenure at exactly 180 days → tenure_score = 1.0
- Tenure at 105 days (midpoint 30–180) → tenure_score = 0.5

### test_seniority.py — unit tests
- email ceo@apple.com with title "CEO" → HIGH_SENIORITY
- email john.doe@mckinsey.com with no title → PROBABLE_SENIORITY
- email user@gmail.com with no title → UNVERIFIED
- title "Head of Product" → HIGH_SENIORITY
- title "senior manager" (lowercase) → HIGH_SENIORITY
- email user@yahoo.com, no title → UNVERIFIED

### test_pipeline.py — integration test (real beehiiv data)
- Fetch exactly 10 real subscribers
- Verify all required output columns present
- Verify all scores 0–100
- Verify no nulls in engagement_score, email, lead_tier

### test_outputs.py — smoke tests
- Build a mock dataframe, call write_csv → assert file written with correct columns
- Call write_summary_md → assert file contains run_date
- Call write_slack_notification → assert file contains "Sena pipeline"
