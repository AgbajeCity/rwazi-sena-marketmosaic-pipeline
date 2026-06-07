"""
pytest configuration for sena_pipeline tests.

Wires the MCP bridge before integration tests run, so test_pipeline.py
can call real beehiiv MCP tools when executed inside a Claude Code session.
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


def pytest_configure(config):
    """Attempt to set the MCP bridge early so integration tests can use it."""
    # Only attempt if we appear to be in a Claude Code session
    mcp_http = os.environ.get("CLAUDE_MCP_HTTP_BASE")
    if not mcp_http:
        return

    import json as _json
    import urllib.request
    import beehiiv_client as client

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

    client.set_mcp_bridge(bridge)
