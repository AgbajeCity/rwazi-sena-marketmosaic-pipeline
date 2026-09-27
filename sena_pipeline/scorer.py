"""Engagement scoring logic."""

from datetime import datetime, timezone
from config import (
    WEIGHT_OPEN_RATE, WEIGHT_CLICK_RATE, WEIGHT_TENURE,
    TENURE_MIN_DAYS, TENURE_MAX_DAYS,
    TIER_TOP, TIER_QUALIFIED, TIER_WARM,
)


def tenure_score(created_at: str | None) -> float:
    """Return 0.0–1.0 based on how long the subscriber has been active."""
    if not created_at:
        return 0.0
    try:
        if isinstance(created_at, datetime):
            sub_date = created_at
        else:
            created_at = created_at.replace("Z", "+00:00")
            sub_date = datetime.fromisoformat(created_at)
        now = datetime.now(timezone.utc)
        days = (now - sub_date).days
    except (ValueError, TypeError):
        return 0.0

    if days < TENURE_MIN_DAYS:
        return 0.0
    if days >= TENURE_MAX_DAYS:
        return 1.0
    return (days - TENURE_MIN_DAYS) / (TENURE_MAX_DAYS - TENURE_MIN_DAYS)


def engagement_score(open_rate: float, click_rate: float, created_at: str | None) -> float:
    """
    Return 0–100 engagement score.

    open_rate and click_rate are expected as percentages (0–100), as returned
    by the beehiiv API. They are normalised internally.
    """
    norm_open = min(open_rate / 100.0, 1.0) if open_rate else 0.0
    norm_click = min(click_rate / 100.0, 1.0) if click_rate else 0.0
    t_score = tenure_score(created_at)

    score = (
        norm_open * WEIGHT_OPEN_RATE
        + norm_click * WEIGHT_CLICK_RATE
        + t_score * WEIGHT_TENURE
    ) * 100

    return round(min(max(score, 0.0), 100.0), 2)


def lead_tier(score: float) -> str:
    """Return the tier label for a given engagement score."""
    if score >= TIER_TOP:
        return "top"
    if score >= TIER_QUALIFIED:
        return "qualified"
    if score >= TIER_WARM:
        return "warm"
    return "excluded"
