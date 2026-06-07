# Sena Subscriber Pipeline

This repo contains the Market Mosaic → Sena lead pipeline for the Rwazi Insights team.

## What this does
Fetches all active Market Mosaic subscribers from beehiiv (pub_422b220b-eb3d-48b7-8341-ba44f5e2cdc7),
scores them by engagement signals, identifies senior executives, and outputs a ranked leads list for the Sena product team.

## Run it
```bash
python sena_pipeline/run.py --mode full
```

## beehiiv MCP
This project uses beehiiv MCP tools directly. The beehiiv connector must be enabled in your Claude Code session.

## Output
- `sena_pipeline/outputs/sena_qualified_leads_latest.csv` — most recent run
- `sena_pipeline/outputs/pipeline_summary.md` — run summary with top prospects
- `sena_pipeline/outputs/slack_notification.txt` — paste-ready Slack message

## Key files
- `sena_pipeline/config.py` — all thresholds, weights, domain lists (edit here only)
- `sena_pipeline/pipeline.py` — main orchestrator
- `sena_pipeline/scorer.py` — engagement scoring
- `sena_pipeline/seniority.py` — seniority detection
- `sena_pipeline/beehiiv_client.py` — all beehiiv API calls

## Pipeline architecture
Two-pass design due to beehiiv API constraints:
1. **Pass 1** — list all 129K active subscribers (email + subscribed_on), apply domain filter
2. **Pass 2** — enrich top N corporate-domain candidates with full engagement stats

Tune `MAX_ENRICHMENT` in config.py to trade off completeness vs runtime.

## Modes
```bash
python sena_pipeline/run.py --mode full          # full re-scan
python sena_pipeline/run.py --mode incremental   # only new subscribers since last run
python sena_pipeline/run.py --mode full --dry-run  # score without writing files
```

## Tests
```bash
pip install -r sena_pipeline/requirements.txt
python -m pytest sena_pipeline/tests/ -v
```

Integration tests (test_pipeline.py) require a live beehiiv MCP session and will skip otherwise.
