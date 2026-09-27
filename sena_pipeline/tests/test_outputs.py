"""Smoke tests for outputs.py."""

import sys
import os
import tempfile
from datetime import date
from pathlib import Path

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pandas as pd
import pytest
import config


@pytest.fixture(autouse=True)
def tmp_output_dir(monkeypatch, tmp_path):
    """Redirect all output writes to a temp directory."""
    monkeypatch.setattr(config, "OUTPUT_DIR", str(tmp_path))
    return tmp_path


def _make_mock_df(n: int = 5) -> pd.DataFrame:
    from outputs import build_output_df
    rows = []
    for i in range(n):
        rows.append({
            "id": f"sub_{i:04d}",
            "email": f"user{i}@company{i}.com",
            "email_domain": f"company{i}.com",
            "company": f"Acme {i}",
            "job_title": "VP of Sales" if i % 2 == 0 else "",
            "role": "",
            "open_rate": 60.0 + i * 5,
            "click_rate": 10.0 + i * 2,
            "created_at": "2025-01-01T00:00:00Z",
            "updated_at": "2026-01-01T00:00:00Z",
            "subscription_days": 200,
            "engagement_score": 55.0 + i * 3,
            "lead_tier": "top" if i >= 3 else "qualified",
            "seniority_tier": "HIGH_SENIORITY" if i % 2 == 0 else "PROBABLE_SENIORITY",
        })
    return build_output_df(rows)


def test_build_output_df_columns():
    df = _make_mock_df()
    required = [
        "subscriber_id", "email", "email_domain", "company", "job_title",
        "seniority_tier", "engagement_score", "open_rate_pct", "click_rate_pct",
        "last_engaged_date", "subscription_created_date", "subscription_days",
        "lead_tier", "recommended_action", "run_date",
    ]
    for col in required:
        assert col in df.columns, f"Missing column: {col}"


def test_build_output_df_no_nulls_in_key_fields():
    df = _make_mock_df(10)
    assert df["email"].notna().all()
    assert df["engagement_score"].notna().all()
    assert df["lead_tier"].notna().all()


def test_write_csv_creates_file(tmp_path):
    from outputs import write_csv
    df = _make_mock_df(5)
    path = write_csv(df, dry_run=False)
    assert path is not None
    assert path.exists()
    loaded = pd.read_csv(path)
    assert len(loaded) == 5


def test_write_csv_creates_latest(tmp_path):
    from outputs import write_csv
    df = _make_mock_df(5)
    write_csv(df, dry_run=False)
    latest = Path(config.OUTPUT_DIR) / "sena_qualified_leads_latest.csv"
    assert latest.exists()


def test_write_csv_dry_run(tmp_path):
    from outputs import write_csv
    df = _make_mock_df(5)
    path = write_csv(df, dry_run=True)
    assert path is None
    # No files should have been created
    assert not any(Path(config.OUTPUT_DIR).glob("*.csv"))


def test_write_summary_md_created(tmp_path):
    from outputs import write_summary_md
    df = _make_mock_df(5)
    path = write_summary_md(df, total_processed=1000, dry_run=False)
    assert path is not None
    assert path.exists()
    content = path.read_text()
    assert date.today().isoformat() in content
    assert "Sena Pipeline Run" in content


def test_write_slack_notification(tmp_path):
    from outputs import write_slack_notification
    df = _make_mock_df(5)
    path = write_slack_notification(df, total_processed=1000, dry_run=False)
    assert path is not None
    assert path.exists()
    content = path.read_text()
    assert "Sena pipeline refreshed" in content
    assert "1,000" in content


def test_recommended_action_logic():
    from outputs import recommended_action
    import pandas as pd

    assert recommended_action(pd.Series({"lead_tier": "top", "seniority_tier": "HIGH_SENIORITY"})) == "Immediate outreach"
    assert recommended_action(pd.Series({"lead_tier": "top", "seniority_tier": "PROBABLE_SENIORITY"})) == "Priority outreach"
    assert recommended_action(pd.Series({"lead_tier": "qualified", "seniority_tier": "PROBABLE_SENIORITY"})) == "Nurture sequence"
    assert recommended_action(pd.Series({"lead_tier": "warm", "seniority_tier": "PROBABLE_SENIORITY"})) == "Monitor"


def test_scores_sorted_descending():
    df = _make_mock_df(5)
    scores = df["engagement_score"].tolist()
    assert scores == sorted(scores, reverse=True)
