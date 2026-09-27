"""
Direct in-agent pipeline runner.

Takes a JSON file of pre-fetched subscriber list entries + a JSON file of
pre-fetched full subscription details, runs the scoring/filtering pipeline,
and writes output files. Used for live runs where MCP tools are not accessible
from subprocess.

Usage:
    python sena_pipeline/run_direct.py \
        --list sena_pipeline/cache/subscriber_list.json \
        --enriched sena_pipeline/cache/enriched_subs.json
"""

import argparse
import json
import sys
import os
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, os.path.dirname(__file__))

import config
from scorer import engagement_score as calc_score, lead_tier
from seniority import classify_seniority, email_domain as get_domain, is_consumer_domain
from outputs import build_output_df, write_csv, write_summary_md, write_slack_notification


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
    for cf in custom_fields or []:
        if cf.get("name") == name:
            return cf.get("value") or ""
    return ""


def run(list_path: str, enriched_path: str, dry_run: bool = False) -> None:
    print("[1/4] Loading subscriber data from cache...")
    with open(list_path) as f:
        all_subs = json.load(f)
    with open(enriched_path) as f:
        enriched_details = json.load(f)  # list of full subscription objects

    total_fetched = len(all_subs)
    enriched_by_id = {s["id"]: s for s in enriched_details}
    print(f"      {total_fetched:,} subscribers in list, {len(enriched_details):,} enriched records")

    print("[2/4] Scoring engagement signals...")
    scored = []
    for sub in all_subs:
        detail = enriched_by_id.get(sub["id"])
        if detail is None:
            continue  # not enriched, skip

        stats = detail.get("stats", {})
        custom_fields = detail.get("custom_fields", [])
        open_rate = stats.get("open_rate") or 0.0
        click_rate = stats.get("click_rate") or 0.0
        created_at = detail.get("created_at") or sub.get("subscribed_on")
        email = detail.get("email", sub.get("email", ""))

        job_title = _extract_custom_field(custom_fields, config.CF_JOB_TITLE)
        role = _extract_custom_field(custom_fields, config.CF_ROLE)
        company = _extract_custom_field(custom_fields, config.CF_COMPANY)

        score = calc_score(open_rate, click_rate, created_at)
        tier = lead_tier(score)

        scored.append({
            "id": detail.get("id", sub["id"]),
            "email": email,
            "email_domain": get_domain(email),
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
            "seniority_tier": "",
        })

    print(f"      Scored {len(scored):,} enriched subscribers")

    print("[3/4] Applying seniority filters...")

    # top 5% threshold for INFERRED
    all_scores = sorted([s["engagement_score"] for s in scored], reverse=True)
    cutoff_idx = max(0, int(len(all_scores) * config.INFERRED_TOP_PERCENTILE / 100) - 1)
    inferred_threshold = all_scores[cutoff_idx] if all_scores else 100.0

    qualified = []
    for s in scored:
        if s["lead_tier"] == "excluded":
            continue
        seniority = classify_seniority(s["email"], s.get("job_title"), s.get("role"))
        s["seniority_tier"] = seniority
        if seniority == "UNVERIFIED":
            if s["engagement_score"] >= inferred_threshold:
                s["lead_tier"] = "top"
                s["seniority_tier"] = "INFERRED"
                qualified.append(s)
        else:
            qualified.append(s)

    print(f"      {len(qualified):,} qualified leads after seniority filter")

    print("[4/4] Writing outputs...")
    if not qualified:
        print("WARNING: Zero qualifying leads.", file=sys.stderr)
        sys.exit(1)

    df = build_output_df(qualified)
    csv_path = write_csv(df, dry_run=dry_run)
    md_path = write_summary_md(df, total_processed=total_fetched, dry_run=dry_run)
    slack_path = write_slack_notification(df, total_processed=total_fetched, dry_run=dry_run)

    if csv_path:
        print(f"\nDone. {len(df):,} qualified leads written to {csv_path}")

    return df


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--list", required=True)
    parser.add_argument("--enriched", required=True)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    run(args.list, args.enriched, dry_run=args.dry_run)
