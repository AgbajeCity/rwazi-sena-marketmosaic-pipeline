"""
beehiiv data fetching via MCP tools.

All beehiiv API interaction lives here. Logic files import from this module only.
MCP tools are invoked by calling the global mcp_call() bridge which is injected
at runtime by run.py. When running under pytest without MCP, the bridge is
replaced with a mock.
"""

import json
import time
import logging
from pathlib import Path
from typing import Any

import config

logger = logging.getLogger(__name__)

# MCP bridge — set by run.py before any pipeline call
_mcp: Any = None


def set_mcp_bridge(bridge) -> None:
    """Inject the MCP tool bridge. Called once from run.py at startup."""
    global _mcp
    _mcp = bridge


def _call_with_retry(tool_name: str, **kwargs) -> dict:
    """Call an MCP tool with retry logic for rate limiting."""
    if _mcp is None:
        raise RuntimeError("MCP bridge not initialised. Call set_mcp_bridge() first.")

    last_exc = None
    for attempt in range(config.MAX_RETRIES + 1):
        try:
            result = _mcp(tool_name, **kwargs)
            if isinstance(result, str):
                result = json.loads(result)
            return result
        except Exception as exc:
            last_exc = exc
            err_str = str(exc).lower()
            is_rate_limit = any(x in err_str for x in ["429", "rate limit", "too many"])
            if is_rate_limit and attempt < config.MAX_RETRIES:
                wait = config.RATE_LIMIT_SLEEP_SECONDS * (attempt + 1)
                logger.warning("Rate limited (attempt %d/%d). Sleeping %ds…",
                               attempt + 1, config.MAX_RETRIES, wait)
                time.sleep(wait)
            elif attempt < config.MAX_RETRIES:
                time.sleep(1)
            else:
                raise RuntimeError(
                    f"beehiiv MCP call '{tool_name}' failed after {config.MAX_RETRIES} retries: {exc}"
                ) from last_exc
    raise RuntimeError(f"beehiiv MCP call '{tool_name}' exhausted retries") from last_exc


def fetch_subscriber_page(page: int, status: str = "active",
                           subscribed_after: str | None = None) -> dict:
    """Fetch one page of subscriptions from the list endpoint."""
    kwargs = dict(
        publication_id=config.PUBLICATION_ID,
        status=status,
        per_page=config.LIST_PAGE_SIZE,
        page=page,
    )
    if subscribed_after:
        kwargs["subscribed_after"] = subscribed_after
    return _call_with_retry("list_subscriptions", **kwargs)


def fetch_all_subscribers(subscribed_after: str | None = None,
                           progress_callback=None) -> list[dict]:
    """
    Page through all active subscribers (Pass 1).
    Returns a flat list of minimal subscriber dicts.
    Writes progress to pipeline_state.json after each page.
    """
    state_path = Path(config.STATE_FILE)
    start_page = 1

    # Resume from state if available
    if state_path.exists():
        try:
            state = json.loads(state_path.read_text())
            start_page = state.get(config.LAST_PAGE_KEY, 0) + 1
        except Exception:
            pass

    all_subs = []
    page = start_page

    while True:
        data = fetch_subscriber_page(page, subscribed_after=subscribed_after)
        subs = data.get("subscriptions", [])
        pagination = data.get("pagination", {})
        total_pages = pagination.get("total_pages", 1)
        total = pagination.get("total", 0)

        all_subs.extend(subs)

        if progress_callback:
            progress_callback(page, total_pages, total)

        # Persist page state
        try:
            existing = {}
            if state_path.exists():
                existing = json.loads(state_path.read_text())
            existing[config.LAST_PAGE_KEY] = page
            state_path.write_text(json.dumps(existing, indent=2))
        except Exception:
            pass

        if page >= total_pages or not subs:
            break
        page += 1

    return all_subs


def fetch_subscription_detail(sub_id: str) -> dict | None:
    """Fetch a full subscription record (Pass 2 enrichment). Returns None on error."""
    try:
        return _call_with_retry("get_subscription", subscription_id=sub_id)
    except Exception as exc:
        logger.warning("Skipping %s — failed to fetch: %s", sub_id, exc)
        return None


def fetch_publication_stats() -> dict:
    """Fetch high-level publication stats."""
    return _call_with_retry("get_publication_stats",
                             publication_id=config.PUBLICATION_ID)
