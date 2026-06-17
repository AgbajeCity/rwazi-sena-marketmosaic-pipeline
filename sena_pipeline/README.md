# Sena Subscriber Pipeline

Converts the Market Mosaic beehiiv newsletter audience (129K+ subscribers) into a ranked list of warm Sena product leads, scored by engagement and seniority signals.

---

## Prerequisites

- Python 3.10+
- A Claude Code session with the **beehiiv MCP connector** enabled
- `pip install -r sena_pipeline/requirements.txt`

---

## Quick start

```bash
# Install dependencies
pip install -r sena_pipeline/requirements.txt

# Run the full pipeline (from repo root, inside a Claude Code session)
python sena_pipeline/run.py --mode full
```

Progress is printed to stdout. Outputs are written to `sena_pipeline/outputs/`.

---

## Output files

| File | Description |
|------|-------------|
| `sena_qualified_leads_YYYY-MM-DD.csv` | Dated qualified leads |
| `sena_qualified_leads_latest.csv` | Always the most recent run |
| `pipeline_summary.md` | Human-readable run summary + top 20 prospects |
| `slack_notification.txt` | Paste-ready Slack message |

### CSV columns

| Column | Description |
|--------|-------------|
| `subscriber_id` | beehiiv subscription ID |
| `email` | Subscriber email |
| `email_domain` | Domain extracted from email |
| `company` | Company (from custom field, if provided) |
| `job_title` | Job title (from custom field, if provided) |
| `seniority_tier` | `HIGH_SENIORITY` / `PROBABLE_SENIORITY` / `INFERRED` |
| `engagement_score` | 0–100 composite score |
| `open_rate_pct` | Email open rate (%) |
| `click_rate_pct` | Email click rate (%) |
| `last_engaged_date` | Last record update timestamp |
| `subscription_created_date` | When they subscribed |
| `subscription_days` | Days since subscription |
| `lead_tier` | `top` / `qualified` / `warm` |
| `recommended_action` | `Immediate outreach` / `Priority outreach` / `Nurture sequence` / `Monitor` |
| `run_date` | Date this pipeline ran |

---

## Scoring model

```
engagement_score = (
    min(open_rate / 100, 1.0) × 0.40
  + min(click_rate / 100, 1.0) × 0.45
  + tenure_score × 0.15
) × 100
```

**Tenure score:** 0 for subscribers < 30 days old; scales linearly 0→1 between 30 and 180 days; 1.0 for 180+ days.

**Note:** The beehiiv API does not expose a `last_engaged_date` field. The recency component from the original spec was removed; its weight was redistributed to open_rate and click_rate. See `config.py` for all weight constants.

---

## Seniority tiers

| Tier | Criteria |
|------|---------|
| `HIGH_SENIORITY` | Job title matches: CEO, CTO, CFO, CMO, VP, Director, Founder, Head of, etc. |
| `PROBABLE_SENIORITY` | Corporate email domain (non-consumer) |
| `INFERRED` | Consumer domain, no title, but top 5% engagement score |
| `UNVERIFIED` | Consumer domain, no title, not top 5% — **excluded from output** |

---

## CLI modes

```bash
# Full scan of all active subscribers
python sena_pipeline/run.py --mode full

# Only subscribers since last run (reads pipeline_state.json)
python sena_pipeline/run.py --mode incremental

# Score without writing output files
python sena_pipeline/run.py --mode full --dry-run
```

---

## Configuration

All thresholds and weights live in `sena_pipeline/config.py`:

| Setting | Default | Description |
|---------|---------|-------------|
| `MAX_ENRICHMENT` | 5000 | Max subscribers to enrich with full stats |
| `TIER_TOP` | 70 | Minimum score for Top tier |
| `TIER_QUALIFIED` | 50 | Minimum score for Qualified tier |
| `TIER_WARM` | 30 | Minimum score for Warm tier |
| `TENURE_MAX_DAYS` | 180 | Days for full tenure score |
| `WEIGHT_OPEN_RATE` | 0.40 | Scoring weight for open rate |
| `WEIGHT_CLICK_RATE` | 0.45 | Scoring weight for click rate |

Increase `MAX_ENRICHMENT` for more comprehensive coverage at the cost of runtime. Each 1,000 enrichments takes approximately 5–8 minutes.

---

## Running tests

```bash
python -m pytest sena_pipeline/tests/ -v
```

Unit tests (`test_scorer.py`, `test_seniority.py`, `test_outputs.py`) run without MCP.
Integration tests (`test_pipeline.py`) require an active beehiiv MCP session and skip otherwise.

---

## Pipeline state

`pipeline_state.json` at the repo root tracks run history:
- `last_run_completed_at` — used by incremental mode
- `last_completed_page` — allows resuming interrupted full runs

Delete this file to start fresh.
