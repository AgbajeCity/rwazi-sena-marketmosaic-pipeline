"""Unit tests for scorer.py."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from datetime import datetime, timedelta, timezone
import pytest
from scorer import engagement_score, tenure_score, lead_tier


def _days_ago(n: int) -> str:
    dt = datetime.now(timezone.utc) - timedelta(days=n)
    return dt.isoformat()


# ── tenure_score ──────────────────────────────────────────────────────────────

def test_tenure_under_30_days():
    assert tenure_score(_days_ago(29)) == 0.0

def test_tenure_exactly_30_days():
    assert tenure_score(_days_ago(30)) == pytest.approx(0.0, abs=0.01)

def test_tenure_at_180_days():
    assert tenure_score(_days_ago(180)) == pytest.approx(1.0, abs=0.01)

def test_tenure_over_180_days():
    assert tenure_score(_days_ago(365)) == 1.0

def test_tenure_midpoint():
    # 30 + (180-30)/2 = 105 days → 0.5
    assert tenure_score(_days_ago(105)) == pytest.approx(0.5, abs=0.02)

def test_tenure_none():
    assert tenure_score(None) == 0.0

def test_tenure_invalid_string():
    assert tenure_score("not-a-date") == 0.0


# ── engagement_score ──────────────────────────────────────────────────────────

def test_zero_rates():
    score = engagement_score(0.0, 0.0, _days_ago(200))
    # open=0, click=0, tenure=1.0 → 0 + 0 + 0.15 = 0.15 × 100 = 15
    assert score == pytest.approx(15.0, abs=0.5)

def test_zero_rates_new_subscriber():
    score = engagement_score(0.0, 0.0, _days_ago(10))
    # tenure=0 → score = 0
    assert score == 0.0

def test_perfect_score():
    score = engagement_score(100.0, 100.0, _days_ago(400))
    assert score == pytest.approx(100.0, abs=0.1)

def test_typical_mid_range():
    # 50% open, 20% click, 200 days old (tenure=1.0)
    # (0.5 × 0.40) + (0.20 × 0.45) + (1.0 × 0.15) = 0.20 + 0.09 + 0.15 = 0.44 → 44
    score = engagement_score(50.0, 20.0, _days_ago(200))
    assert score == pytest.approx(44.0, abs=1.0)

def test_score_capped_at_100():
    score = engagement_score(200.0, 200.0, _days_ago(400))
    assert score == 100.0

def test_score_never_negative():
    score = engagement_score(-5.0, -5.0, _days_ago(200))
    assert score >= 0.0

def test_high_open_low_click():
    # 80% open, 0% click, 180+ days
    # (0.8 × 0.40) + (0 × 0.45) + (1.0 × 0.15) = 0.32 + 0 + 0.15 = 0.47 → 47
    score = engagement_score(80.0, 0.0, _days_ago(200))
    assert score == pytest.approx(47.0, abs=1.0)


# ── lead_tier ─────────────────────────────────────────────────────────────────

def test_tier_top():
    assert lead_tier(70.0) == "top"
    assert lead_tier(99.9) == "top"

def test_tier_qualified():
    assert lead_tier(50.0) == "qualified"
    assert lead_tier(69.9) == "qualified"

def test_tier_warm():
    assert lead_tier(30.0) == "warm"
    assert lead_tier(49.9) == "warm"

def test_tier_excluded():
    assert lead_tier(29.9) == "excluded"
    assert lead_tier(0.0) == "excluded"
