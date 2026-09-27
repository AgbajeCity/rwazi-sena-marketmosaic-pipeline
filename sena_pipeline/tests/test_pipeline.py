"""
Integration tests for the pipeline using real beehiiv data via MCP.

These tests require the beehiiv MCP connector to be active.
They fetch 10 real subscribers and verify output shape.
"""

import sys
import os
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
import config


# ── MCP bridge fixture ────────────────────────────────────────────────────────

def _build_test_bridge():
    """
    Build an MCP bridge for testing.
    Attempts to use the session's MCP tools; skips if unavailable.
    """
    import beehiiv_client as client

    # Check if a bridge is already set (set by the test runner or pytest plugin)
    if client._mcp is not None:
        return client._mcp

    # Try to build from environment
    mcp_http = os.environ.get("CLAUDE_MCP_HTTP_BASE")
    if mcp_http:
        import urllib.request
        import json as _json

        def bridge(tool_name: str, **kwargs) -> dict:
            url = f"{mcp_http}/call"
            payload = _json.dumps({
                "tool": f"mcp__beehiiv__{tool_name}",
                "arguments": kwargs,
            }).encode()
            req = urllib.request.Request(
                url, data=payload,
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                return _json.loads(resp.read())
        return bridge

    return None


@pytest.fixture(scope="module")
def mcp_bridge():
    bridge = _build_test_bridge()
    if bridge is None:
        pytest.skip("MCP bridge not available — run inside a Claude Code session")
    return bridge


@pytest.fixture(scope="module")
def ten_subscribers(mcp_bridge, tmp_path_factory):
    """Fetch and enrich 10 real subscribers for integration testing."""
    import beehiiv_client as client
    client.set_mcp_bridge(mcp_bridge)

    # Override state file to a temp path
    import config as cfg
    original_state = cfg.STATE_FILE
    cfg.STATE_FILE = str(tmp_path_factory.mktemp("state") / "pipeline_state.json")

    try:
        # Fetch first page only
        data = client.fetch_subscriber_page(1, status="active")
        subs = data.get("subscriptions", [])[:10]
        assert len(subs) == 10, f"Expected 10 subscribers, got {len(subs)}"

        # Enrich all 10
        enriched = []
        for sub in subs:
            detail = client.fetch_subscription_detail(sub["id"])
            if detail:
                enriched.append(detail)

        return enriched
    finally:
        cfg.STATE_FILE = original_state


# ── Integration tests ─────────────────────────────────────────────────────────

def test_fetched_10_records(ten_subscribers):
    assert len(ten_subscribers) >= 8  # allow for up to 2 fetch failures


def test_all_have_email(ten_subscribers):
    for sub in ten_subscribers:
        assert sub.get("email"), f"Missing email in {sub.get('id')}"


def test_all_have_stats(ten_subscribers):
    for sub in ten_subscribers:
        stats = sub.get("stats", {})
        assert "open_rate" in stats, f"Missing open_rate in {sub.get('id')}"
        assert "click_rate" in stats, f"Missing click_rate in {sub.get('id')}"


def test_scores_in_range(ten_subscribers):
    from scorer import engagement_score as calc_score
    for sub in ten_subscribers:
        stats = sub.get("stats", {})
        score = calc_score(
            stats.get("open_rate") or 0.0,
            stats.get("click_rate") or 0.0,
            sub.get("created_at"),
        )
        assert 0.0 <= score <= 100.0, f"Score {score} out of range for {sub.get('id')}"


def test_output_df_columns(ten_subscribers, tmp_path, monkeypatch):
    """Build a minimal pipeline output from the 10 real subscribers."""
    from datetime import datetime, timezone, timedelta
    from scorer import engagement_score as calc_score, lead_tier
    from seniority import classify_seniority, email_domain as get_domain
    from outputs import build_output_df

    monkeypatch.setattr(config, "OUTPUT_DIR", str(tmp_path))

    rows = []
    for sub in ten_subscribers:
        stats = sub.get("stats", {})
        open_rate = stats.get("open_rate") or 0.0
        click_rate = stats.get("click_rate") or 0.0
        created_at = sub.get("created_at", "")

        score = calc_score(open_rate, click_rate, created_at)
        tier = lead_tier(score)

        custom_fields = sub.get("custom_fields", [])
        job_title = next((cf.get("value", "") for cf in custom_fields
                          if cf.get("name") == "job_title"), "")
        company = next((cf.get("value", "") for cf in custom_fields
                        if cf.get("name") == "company"), "")

        rows.append({
            "id": sub["id"],
            "email": sub["email"],
            "email_domain": get_domain(sub["email"]),
            "company": company,
            "job_title": job_title,
            "role": "",
            "open_rate": open_rate,
            "click_rate": click_rate,
            "created_at": created_at,
            "updated_at": sub.get("updated_at", ""),
            "subscription_days": 0,
            "engagement_score": score,
            "lead_tier": tier,
            "seniority_tier": classify_seniority(sub["email"], job_title),
        })

    df = build_output_df(rows)

    required_cols = [
        "subscriber_id", "email", "email_domain", "company", "job_title",
        "seniority_tier", "engagement_score", "open_rate_pct", "click_rate_pct",
        "last_engaged_date", "subscription_created_date", "subscription_days",
        "lead_tier", "recommended_action", "run_date",
    ]
    for col in required_cols:
        assert col in df.columns, f"Missing column: {col}"

    assert df["email"].notna().all()
    assert df["engagement_score"].notna().all()
    assert df["lead_tier"].notna().all()
    assert (df["engagement_score"] >= 0).all()
    assert (df["engagement_score"] <= 100).all()
