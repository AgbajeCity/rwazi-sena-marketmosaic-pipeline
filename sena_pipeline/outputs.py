"""CSV, markdown report, and Slack notification generation."""

import sys
from datetime import date
from pathlib import Path

import pandas as pd

import config


def _output_path(filename: str) -> Path:
    p = Path(config.OUTPUT_DIR)
    p.mkdir(parents=True, exist_ok=True)
    return p / filename


def recommended_action(row: pd.Series) -> str:
    tier = row.get("lead_tier", "")
    seniority = row.get("seniority_tier", "")
    if tier == "top" and seniority == "HIGH_SENIORITY":
        return "Immediate outreach"
    if tier == "top" and seniority == "PROBABLE_SENIORITY":
        return "Priority outreach"
    if tier == "top":
        return "Priority outreach"
    if tier == "qualified":
        return "Nurture sequence"
    if tier == "warm":
        return "Monitor"
    return "Monitor"


def build_output_df(scored: list[dict]) -> pd.DataFrame:
    """Convert scored subscriber dicts to the canonical output dataframe."""
    rows = []
    run_date = date.today().isoformat()
    for s in scored:
        row = {
            "subscriber_id": s.get("id", ""),
            "email": s.get("email", ""),
            "email_domain": s.get("email_domain", ""),
            "company": s.get("company", ""),
            "job_title": s.get("job_title", ""),
            "seniority_tier": s.get("seniority_tier", ""),
            "engagement_score": s.get("engagement_score", 0.0),
            "open_rate_pct": s.get("open_rate", 0.0),
            "click_rate_pct": s.get("click_rate", 0.0),
            "last_engaged_date": s.get("updated_at", ""),
            "subscription_created_date": s.get("created_at", ""),
            "subscription_days": s.get("subscription_days", 0),
            "lead_tier": s.get("lead_tier", ""),
            "recommended_action": "",
            "run_date": run_date,
        }
        rows.append(row)

    df = pd.DataFrame(rows)
    if df.empty:
        return df

    df["recommended_action"] = df.apply(recommended_action, axis=1)
    df = df.sort_values("engagement_score", ascending=False).reset_index(drop=True)
    return df


def write_csv(df: pd.DataFrame, dry_run: bool = False) -> Path | None:
    """Write dated CSV and overwrite the 'latest' copy. Returns dated path."""
    if dry_run:
        print(f"  [dry-run] Would write {len(df)} rows to CSV")
        return None
    if df.empty:
        print("WARNING: No qualifying leads — CSV not written.", file=sys.stderr)
        return None

    run_date = date.today().isoformat()
    dated_path = _output_path(f"sena_qualified_leads_{run_date}.csv")
    latest_path = _output_path("sena_qualified_leads_latest.csv")

    df.to_csv(dated_path, index=False)
    df.to_csv(latest_path, index=False)
    return dated_path


def write_summary_md(df: pd.DataFrame, total_processed: int, dry_run: bool = False) -> Path | None:
    """Write pipeline_summary.md."""
    run_date = date.today().isoformat()
    if dry_run:
        print(f"  [dry-run] Would write pipeline_summary.md")
        return None

    if df.empty:
        return None

    n_qualified = len(df)
    n_top = (df["lead_tier"] == "top").sum()
    n_qualified_tier = (df["lead_tier"] == "qualified").sum()
    n_warm = (df["lead_tier"] == "warm").sum()
    n_high = (df["seniority_tier"] == "HIGH_SENIORITY").sum()
    n_probable = (df["seniority_tier"] == "PROBABLE_SENIORITY").sum()

    top20 = df.head(20)[["email_domain", "company", "job_title",
                          "engagement_score", "lead_tier", "recommended_action"]]

    top20_lines = ["| # | Domain | Company | Title | Score | Tier | Action |",
                   "|---|--------|---------|-------|-------|------|--------|"]
    for i, (_, row) in enumerate(top20.iterrows(), 1):
        top20_lines.append(
            f"| {i} | {row['email_domain']} | {row['company'] or '—'} | "
            f"{row['job_title'] or '—'} | {row['engagement_score']:.1f} | "
            f"{row['lead_tier']} | {row['recommended_action']} |"
        )

    scores = df["engagement_score"]
    mean_score = scores.mean()
    median_score = scores.median()
    p90_score = scores.quantile(0.9)

    lines = [
        f"# Sena Pipeline Run — {run_date}",
        "",
        "## Summary",
        "",
        f"- Total active subscribers processed: {total_processed:,}",
        f"- Total qualified leads output: {n_qualified:,}",
        f"- Top tier (score ≥ {config.TIER_TOP}): {n_top:,}",
        f"- Qualified tier ({config.TIER_QUALIFIED}–{config.TIER_TOP - 1}): {n_qualified_tier:,}",
        f"- Warm tier ({config.TIER_WARM}–{config.TIER_QUALIFIED - 1}): {n_warm:,}",
        f"- HIGH_SENIORITY confirmed: {n_high:,}",
        f"- PROBABLE_SENIORITY (corporate domain): {n_probable:,}",
        "",
        "## Top 20 Prospects by Engagement Score",
        "",
        *top20_lines,
        "",
        "## Engagement Distribution",
        "",
        f"- Mean score: {mean_score:.1f}",
        f"- Median score: {median_score:.1f}",
        f"- 90th percentile: {p90_score:.1f}",
        "",
        "## Next Steps for Sena Team",
        "",
        "1. Download `sena_qualified_leads_latest.csv` and import into your CRM or outreach tool",
        "2. Prioritise \"Immediate outreach\" rows first",
        "3. Re-run this pipeline weekly by opening a new Claude Code session in this repo",
    ]

    out_path = _output_path("pipeline_summary.md")
    out_path.write_text("\n".join(lines))
    return out_path


def write_slack_notification(df: pd.DataFrame, total_processed: int,
                              dry_run: bool = False) -> Path | None:
    """Write plain-text Slack notification."""
    run_date = date.today().isoformat()
    if dry_run:
        print(f"  [dry-run] Would write slack_notification.txt")
        return None
    if df.empty:
        return None

    n_qualified = len(df)
    n_top = (df["lead_tier"] == "top").sum()
    n_qualified_tier = (df["lead_tier"] == "qualified").sum()
    n_warm = (df["lead_tier"] == "warm").sum()

    text = (
        f"Sena pipeline refreshed — {run_date}\n"
        f"{n_qualified} qualified leads surfaced from {total_processed:,} Market Mosaic subscribers\n"
        f"Top tier (score ≥{config.TIER_TOP}): {n_top} | "
        f"Qualified ({config.TIER_QUALIFIED}-{config.TIER_TOP - 1}): {n_qualified_tier} | "
        f"Warm ({config.TIER_WARM}-{config.TIER_QUALIFIED - 1}): {n_warm}\n"
        f"File: sena_qualified_leads_{run_date}.csv"
    )

    out_path = _output_path("slack_notification.txt")
    out_path.write_text(text)
    return out_path
