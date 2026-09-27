"""
Main orchestrator: fetch → score → filter → output.
"""

import json
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

import beehiiv_client as client
import config
from scorer import engagement_score as calc_score, lead_tier, tenure_score
from seniority import classify_seniority, email_domain, is_consumer_domain
from outputs import build_output_df, write_csv, write_summary_md, write_slack_notification

logger = logging.getLogger(__name__)


def _subscription_days(created_at: str | None) -> int:
    if not created_at:
        return 0
    try:
        ts = created_at.replace("Z", "+00:00")
        sub_date = datetime.fromisoformat(ts)
        return max(0, (datetime.now(timezone.utc) - sub_date).days)
    except Exception:
        return 0


def _extract_custom_field(custom_fields: list, name: str) -> str:
    """Pull a value from the beehiiv custom_fields array by field name."""
    for cf in custom_fields or []:
        if cf.get("name") == name:
            return cf.get("value") or ""
    return ""


def run_pipeline(mode: str = "full", dry_run: bool = False) -> pd.DataFrame:
    """
    Execute the full pipeline. Returns the output dataframe.

    mode: "full" | "incremental"
    dry_run: score but do not write output files
    """
    # ── Determine incremental cutoff ─────────────────────────────────────────
    subscribed_after = None
    if mode == "incremental":
        state_path = Path(config.STATE_FILE)
        if state_path.exists():
            try:
                state = json.loads(state_path.read_text())
                subscribed_after = state.get(config.LAST_RUN_KEY)
                if subscribed_after:
                    print(f"  Incremental mode: fetching subscribers since {subscribed_after}")
            except Exception:
                pass
        if not subscribed_after:
            print("  No prior run state found — falling back to full mode.", file=sys.stderr)

    # ── Pass 1: fetch all subscriber list entries ─────────────────────────────
    print("[1/4] Fetching subscribers from beehiiv… (this may take several minutes)")

    def _progress(page, total_pages, total):
        if page % 50 == 0 or page == total_pages:
            print(f"      Page {page}/{total_pages} ({total:,} total subscribers)")

    raw_subs = client.fetch_all_subscribers(
        subscribed_after=subscribed_after,
        progress_callback=_progress,
    )
    total_fetched = len(raw_subs)
    print(f"      Fetched {total_fetched:,} subscriber records from list")

    # ── Domain pre-filter ─────────────────────────────────────────────────────
    candidates = [s for s in raw_subs if not is_consumer_domain(s.get("email", ""))]
    print(f"      {len(candidates):,} pass domain filter (corporate email addresses)")

    # ── Pass 2: enrich candidates with full stats ─────────────────────────────
    print("[2/4] Scoring engagement signals…")
    limit = config.MAX_ENRICHMENT
    to_enrich = candidates[:limit]
    if len(candidates) > limit:
        print(f"      Enriching top {limit:,} of {len(candidates):,} candidates "
              f"(set MAX_ENRICHMENT in config.py to increase)")

    enriched = []
    skipped = 0
    for i, sub in enumerate(to_enrich, 1):
        if i % 500 == 0:
            print(f"      Enriched {i:,}/{len(to_enrich):,}…")
        detail = client.fetch_subscription_detail(sub["id"])
        if detail is None:
            skipped += 1
            continue

        stats = detail.get("stats", {})
        custom_fields = detail.get("custom_fields", [])
        open_rate = stats.get("open_rate") or 0.0
        click_rate = stats.get("click_rate") or 0.0
        created_at = detail.get("created_at") or sub.get("subscribed_on")

        job_title = _extract_custom_field(custom_fields, config.CF_JOB_TITLE)
        role = _extract_custom_field(custom_fields, config.CF_ROLE)
        company = _extract_custom_field(custom_fields, config.CF_COMPANY)

        score = calc_score(open_rate, click_rate, created_at)
        tier = lead_tier(score)

        enriched.append({
            "id": detail.get("id", sub["id"]),
            "email": detail.get("email", sub.get("email", "")),
            "email_domain": email_domain(detail.get("email", sub.get("email", ""))),
            "company": company,
            "job_title": job_title,
            "role": role,
            "open_rate": open_rate,
            "click_rate": click_rate,
            "created_at": created_at,
            "updated_at": detail.get("updated_at", ""),
            "subscription_days": _subscription_days(created_at),
            "engagement_score": score,
            "lead_tier": tier,
            "seniority_tier": "",  # filled in Pass 3
        })

    if skipped:
        logger.warning("Skipped %d subscribers due to fetch errors", skipped)

    # ── Pass 3: seniority classification & filtering ──────────────────────────
    print("[3/4] Applying seniority filters…")

    # Compute top-5% threshold for INFERRED tier
    all_scores = [s["engagement_score"] for s in enriched]
    if all_scores:
        all_scores_sorted = sorted(all_scores, reverse=True)
        cutoff_idx = max(0, int(len(all_scores_sorted) * config.INFERRED_TOP_PERCENTILE / 100) - 1)
        inferred_threshold = all_scores_sorted[cutoff_idx] if all_scores_sorted else 0.0
    else:
        inferred_threshold = 100.0

    qualified = []
    for s in enriched:
        if s["lead_tier"] == "excluded":
            continue

        seniority = classify_seniority(s["email"], s.get("job_title"), s.get("role"))
        s["seniority_tier"] = seniority

        if seniority == "UNVERIFIED":
            # Only include if in top 5% of engagement scores
            if s["engagement_score"] >= inferred_threshold:
                s["lead_tier"] = "top"  # already high score
                s["seniority_tier"] = "INFERRED"
                qualified.append(s)
        else:
            qualified.append(s)

    print(f"      {len(qualified):,} qualified leads after seniority filter")

    # ── Pass 4: write outputs ─────────────────────────────────────────────────
    print("[4/4] Writing outputs…")

    if not qualified:
        print("WARNING: Zero qualifying leads found.", file=sys.stderr)
        sys.exit(1)

    df = build_output_df(qualified)
    csv_path = write_csv(df, dry_run=dry_run)
    md_path = write_summary_md(df, total_processed=total_fetched, dry_run=dry_run)
    slack_path = write_slack_notification(df, total_processed=total_fetched, dry_run=dry_run)

    # ── Persist run state ─────────────────────────────────────────────────────
    if not dry_run:
        state_path = Path(config.STATE_FILE)
        try:
            existing = {}
            if state_path.exists():
                existing = json.loads(state_path.read_text())
            existing[config.LAST_RUN_KEY] = datetime.now(timezone.utc).isoformat()
            # Clear page counter after successful run
            existing.pop(config.LAST_PAGE_KEY, None)
            state_path.write_text(json.dumps(existing, indent=2))
        except Exception as exc:
            logger.warning("Could not write pipeline state: %s", exc)

    if csv_path:
        n = len(df)
        print(f"\nDone. {n:,} qualified leads written to {csv_path}")

    return df
