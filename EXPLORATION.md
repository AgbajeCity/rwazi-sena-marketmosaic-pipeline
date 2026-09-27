# Phase 1 — Exploration Notes
_Conducted: 2026-06-07_

## 1. Available beehiiv MCP Tools

Full list of tools confirmed available in this session:

| Tool | Purpose |
|------|---------|
| `list_subscriptions` | Paginated list of subscriptions (minimal fields) |
| `get_subscription` | Full subscription record including engagement stats and custom fields |
| `get_publication_stats` | High-level publication metrics (active subs, open/click rates, growth) |
| `list_custom_fields` | All custom field definitions for the publication |
| `get_publication` | Publication profile and config |
| `get_engagements` | Time-series engagement metrics |
| `list_segments`, `get_segment` | Audience segments |
| `get_current_user` | Auth context |
| `list_posts`, `get_post`, `get_post_stats` | Post content and metrics |
| `search_documentation` | beehiiv docs search |

---

## 2. Publication Stats (pub_422b220b-eb3d-48b7-8341-ba44f5e2cdc7)

```
current_active_subscribers: 129,097
last_4_weeks.open_rate:      22.58%
last_4_weeks.click_rate:      3.86%
last_4_weeks.new_subscribers: 15
last_4_weeks.churned:         894
last_4_weeks.net:            -879
last_4_weeks.earnings:       $1,773.27
```

**Key insight:** The publication has 129,097 active subscribers (not 130K as estimated — effectively 129K). Net subscriber growth is negative over the last 4 weeks, indicating churn > acquisition. Engagement rates (22.6% open, 3.9% click) are above B2B newsletter benchmarks.

---

## 3. Raw `list_subscriptions` Response Shape

Fields returned per subscriber **in list mode** (paginated endpoint):
```json
{
  "id": "sub_cfa74fa3-...",
  "email": "ralfsimons@live.nl",
  "status": "active",
  "tags": [],
  "tiers": [],
  "acquisition_source": "recommendation: andrewdremin.beehiiv.com / referral",
  "subscribed_on": "2026-06-05T19:11:31Z",
  "unsubscribed_on": null
}
```

**Missing from list response:** engagement stats, custom fields, location, referral_url. These require a separate `get_subscription` call per subscriber.

Pagination metadata:
```
total: 129,097
per_page max: 100
total_pages: 1,291
```

---

## 4. Full `get_subscription` Response Shape

Additional fields returned by individual record fetch:
```json
{
  "id": "sub_8093abce-...",
  "email": "daniel.sowden@tjmorris.co.uk",
  "status": "active",
  "tags": [],
  "tiers": [],
  "acquisition_source": "...",
  "location": "Athens, Attica, GR",
  "referral_url": "https://newsletter.rwazi.com/subscribe?ref=...",
  "custom_fields": [],
  "stats": {
    "total_delivered": 5,
    "total_unique_opened": 4,
    "open_rate": 80.0,
    "click_rate": 0.0
  },
  "created_at": "2026-05-25T17:15:38Z",
  "updated_at": "2026-05-25T17:15:38Z",
  "unsubscribed_at": null
}
```

**Stats fields confirmed:**
- `open_rate` — percentage (0–100), NOT a ratio
- `click_rate` — percentage (0–100), NOT a ratio
- `total_delivered` — integer, total emails sent
- `total_unique_opened` — integer

**CRITICAL FINDING — No `last_engaged_date`:**
There is no explicit last-engagement timestamp in the subscription object. The `updated_at` field exists but reflects record update time, not necessarily last email open/click. The recency component of the scoring model must be redesigned.

**Adjusted recency approach:** Use `updated_at` as an engagement recency proxy for subscribers where custom `get_subscription` is called. For list-only pass, recency will not be available — drop recency from list-only scoring.

---

## 5. Custom Fields (31 fields total)

### Directly useful for seniority/identity:
| Field name | Display | Type | ID |
|------------|---------|------|----|
| `job_title` | Job Title | string | `198cc52a-...` |
| `company` | Company | string | `05e8ea03-...` |
| `role` | Role | string | `48852aa6-...` |
| `first_name` | First Name | string | `734ab7d0-...` |
| `last_name` | Last Name | string | `39054fb6-...` |
| `full_name` | Full Name | string | `f881aba2-...` |
| `linkedin_profile` | LinkedIn Profile | string | `254fda06-...` |

### Notable survey/preference fields (not used for scoring):
- `favorite_topics` (list — industry interests)
- `market_mosaic_topics_you_want_to_see` (list)
- `would_you_be_open_to_a_quick_15_min_call_*` (string — sales signal!)
- `rh_partner`, `rh_partner_name`, `rh_source`, `rh_isref`, `rh_subid` — referral attribution

**CRITICAL FINDING — Custom fields sparsely populated:**
Both full subscription records fetched returned `custom_fields: []`. This strongly suggests that `job_title` and `company` are filled only for subscribers who completed signup forms explicitly. The majority of seniority detection will rely on email domain analysis (PROBABLE_SENIORITY), not custom field title matching (HIGH_SENIORITY).

**Bonus finding:** The field `would_you_be_open_to_a_quick_15_min_call_*` is a strong sales-intent signal. Subscribers who completed this field affirmatively should be flagged as high-priority.

---

## 6. API Architecture Constraint — Critical Design Decision

**Problem:** Engagement stats (open_rate, click_rate) are only available via `get_subscription` (individual call), NOT via `list_subscriptions`. Processing all 129,097 subscribers individually would require ~129,097 API calls — impractical.

**Solution: Two-pass architecture**

**Pass 1 — List scan (1,291 API calls):**
- Page through all active subscribers via `list_subscriptions` (100/page)
- Collect: subscriber_id, email, subscribed_on
- Apply domain-based pre-filter: exclude consumer domains (gmail, yahoo, etc.)
- Apply tenure pre-filter: drop subscribers < 30 days old (tenure_score = 0)
- This reduces the candidate set from ~129K to an estimated 15–30K corporate-domain subscribers

**Pass 2 — Enrichment (estimated 15–30K API calls):**
- Call `get_subscription` only for domain-filtered candidates
- Collect: open_rate, click_rate, custom fields (job_title, company), updated_at
- Score and rank

**Estimated runtime:** At ~2 calls/second (conservative with retry logic), Pass 1 = ~11 minutes, Pass 2 (20K candidates) = ~2.7 hours. This exceeds the 10-minute target.

**Revised strategy for practical execution:**
- For `--mode full`: execute Pass 1 only, score based on domain/tenure signals, flag high-value corporate domains
- Enrich top N candidates (configurable, default 5,000) via Pass 2 for full engagement scoring
- For `--mode incremental`: fetch only subscribers active since last run, enrich all of them

---

## 7. Revised Scoring Model

Since `last_engaged_date` is not available directly, and per-subscriber engagement stats require individual API calls (Pass 2), the scoring model has two tiers:

**Tier A — Domain-only score (available after Pass 1, all subscribers):**
```
domain_score = tenure_score(subscribed_on) * 100
```
Used to rank and filter before Pass 2 enrichment.

**Tier B — Full engagement score (available after Pass 2, enriched subscribers):**
```
engagement_score = (
  normalise(open_rate)  * 0.40
  + normalise(click_rate) * 0.45
  + tenure_score(created_at) * 0.15
) * 100
```

**Change from spec:** Recency (0.15 weight) is dropped because `last_engaged_date` does not exist in the API. Its weight is redistributed to click_rate (+0.05) and open_rate (+0.05), with tenure_score keeping 0.15 as a proxy for commitment. This is documented in config.py.

---

## 8. Subscriber Data Sample Quality

From page 500 of the subscriber list (bulk import cohort, Sept 2025):
- Heavy concentration from insurance/finance sector (lockton.com, usi.com, nfp.com, brokerlink.ca, bbrown.com, rbc.com, prudential.com, assurant.com)
- These are all corporate domains → PROBABLE_SENIORITY tier
- Suggests significant B2B penetration via bulk imports

This validates the PROBABLE_SENIORITY strategy — corporate domain filtering will surface substantial enterprise leads even without job titles.

---

## 9. Summary of Adjustments to Spec

| Spec Assumption | Reality | Adjustment |
|----------------|---------|------------|
| `last_engaged_date` field exists | Does NOT exist | Removed recency component; redistributed weights |
| Custom fields (job_title, company) commonly populated | Sparsely populated (empty for all sampled records) | HIGH_SENIORITY will be rare; PROBABLE_SENIORITY is primary signal |
| Single-pass fetch of all 129K subscribers with stats | Stats require individual API calls | Two-pass architecture; enrich top N only |
| 130K subscribers | 129,097 active | Updated counts |
| Scoring uses open_rate as 0–1 ratio | API returns 0–100 percentage | Normalise by dividing by 100 |
| Pipeline completes in <10 minutes | Full enrichment of 129K would take hours | Configurable enrichment limit (default 5K); full list scan in ~13 min |
