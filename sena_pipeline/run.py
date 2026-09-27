"""
CLI entry point for the Sena Subscriber Pipeline.

Usage:
    python sena_pipeline/run.py --mode full
    python sena_pipeline/run.py --mode incremental
    python sena_pipeline/run.py --mode full --dry-run
"""

import argparse
import json
import logging
import sys
import os
import time

# Ensure sena_pipeline/ is on the path when invoked as `python sena_pipeline/run.py`
sys.path.insert(0, os.path.dirname(__file__))

import beehiiv_client as client
import config


def _make_mcp_bridge():
    """
    Return a callable that routes tool names to the injected MCP functions.

    In a Claude Code session the MCP tools are available as module-level
    callables imported from the runtime. We reflect on them at call time so
    the bridge works regardless of how the session wires things up.
    """
    try:
        # Try importing the beehiiv MCP module that Claude Code injects
        import mcp_tool_runner  # noqa: F401  (may or may not exist)
        def bridge(tool_name: str, **kwargs) -> dict:
            import mcp_tool_runner as runner
            return runner.call(tool_name, **kwargs)
        return bridge
    except ImportError:
        pass

    # Fallback: use the MCP tools that are available as globals in this process.
    # Claude Code injects them into builtins or as importable callables.
    # We resolve each tool lazily by name.
    def bridge(tool_name: str, **kwargs) -> dict:
        # Map tool names to the actual MCP callables available in session
        tool_map = _discover_mcp_tools()
        if tool_name not in tool_map:
            raise RuntimeError(
                f"MCP tool '{tool_name}' not found. "
                "Ensure the beehiiv MCP connector is enabled in your Claude Code session."
            )
        return tool_map[tool_name](**kwargs)

    return bridge


def _discover_mcp_tools() -> dict:
    """
    Discover available beehiiv MCP tools.

    In a Claude Code MCP session, tools are callable via the claude_mcp module
    or similar injection. This function tries several discovery strategies.
    """
    tools = {}

    # Strategy 1: try direct import of known MCP module patterns
    for module_name in ["claude_mcp", "mcp", "beehiiv_mcp"]:
        try:
            import importlib
            mod = importlib.import_module(module_name)
            for name in ["list_subscriptions", "get_subscription", "get_publication_stats"]:
                if hasattr(mod, name):
                    tools[name] = getattr(mod, name)
        except ImportError:
            pass

    # Strategy 2: check if MCP callables were injected into builtins
    import builtins
    for name in ["list_subscriptions", "get_subscription", "get_publication_stats"]:
        if hasattr(builtins, f"mcp__beehiiv__{name}"):
            tools[name] = getattr(builtins, f"mcp__beehiiv__{name}")

    return tools


def _make_direct_mcp_bridge(mcp_module):
    """
    Build a bridge from a module that has mcp__beehiiv__* callables as attributes.
    Used when run.py is executed directly inside a Claude Code session context.
    """
    tool_prefix = "mcp__beehiiv__"

    def bridge(tool_name: str, **kwargs) -> dict:
        full_name = f"{tool_prefix}{tool_name}"
        fn = getattr(mcp_module, full_name, None)
        if fn is None:
            raise RuntimeError(
                f"MCP tool '{full_name}' not available. "
                "Check that the beehiiv connector is enabled."
            )
        result = fn(**kwargs)
        if isinstance(result, str):
            import json as _json
            return _json.loads(result)
        return result

    return bridge


class _InProcessMCPBridge:
    """
    Bridge that calls MCP tools via the Claude Code session's MCP infrastructure.

    When Claude Code runs this script, it provides MCP access through the
    CLAUDE_MCP_SOCKET environment variable or similar mechanism.
    This bridge communicates with that infrastructure.
    """

    def __init__(self):
        self._tools = self._load_tools()

    def _load_tools(self) -> dict:
        """Load available beehiiv tools from the session."""
        # Try to import the MCP callable registry that Claude Code provides
        # when scripts run inside a Claude Code session
        try:
            from claude_code_mcp import get_tool  # type: ignore
            return {"_registry": get_tool}
        except ImportError:
            pass
        return {}

    def __call__(self, tool_name: str, **kwargs) -> dict:
        if "_registry" in self._tools:
            fn = self._tools["_registry"](f"mcp__beehiiv__{tool_name}")
            return fn(**kwargs)
        raise RuntimeError(
            f"Cannot call MCP tool '{tool_name}': no MCP bridge available.\n"
            "Run this script from within a Claude Code session with the beehiiv connector enabled."
        )


def build_mcp_bridge_for_session():
    """
    Build the MCP bridge appropriate for the current execution context.

    When Claude Code executes this as a subprocess, it injects MCP access
    via environment. We detect that and build the right bridge.
    """
    # Check if we're running inside a Claude Code session with MCP socket
    mcp_socket = os.environ.get("CLAUDE_MCP_SOCKET") or os.environ.get("MCP_SOCKET")
    if mcp_socket:
        return _SocketMCPBridge(mcp_socket)

    # Fallback to in-process bridge
    return _InProcessMCPBridge()


class _SocketMCPBridge:
    """Communicate with Claude Code's MCP socket for tool calls."""

    def __init__(self, socket_path: str):
        self.socket_path = socket_path

    def __call__(self, tool_name: str, **kwargs) -> dict:
        import socket as _socket
        import json as _json

        full_name = f"mcp__beehiiv__{tool_name}"
        payload = _json.dumps({"tool": full_name, "arguments": kwargs})

        for attempt in range(3):
            try:
                sock = _socket.socket(_socket.AF_UNIX, _socket.SOCK_STREAM)
                sock.settimeout(30)
                sock.connect(self.socket_path)
                sock.sendall((payload + "\n").encode())

                chunks = []
                while True:
                    chunk = sock.recv(65536)
                    if not chunk:
                        break
                    chunks.append(chunk)
                sock.close()

                response = _json.loads(b"".join(chunks).decode())
                if "error" in response:
                    raise RuntimeError(f"MCP error: {response['error']}")
                return response.get("result", response)
            except Exception as exc:
                if attempt == 2:
                    raise
                time.sleep(1)


def _make_claude_mcp_bridge():
    """
    The primary bridge used when run.py is executed by Claude Code's Bash tool.

    Claude Code makes MCP tools available by running a local HTTP/Unix server.
    We detect the server address from the environment and call it directly.
    """
    import urllib.request
    import urllib.error

    mcp_base = os.environ.get("CLAUDE_MCP_HTTP_BASE")
    if not mcp_base:
        return None

    def bridge(tool_name: str, **kwargs) -> dict:
        import json as _json
        url = f"{mcp_base}/call"
        payload = _json.dumps({
            "tool": f"mcp__beehiiv__{tool_name}",
            "arguments": kwargs
        }).encode()

        req = urllib.request.Request(
            url,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            return _json.loads(resp.read())

    return bridge


def main():
    parser = argparse.ArgumentParser(description="Sena Subscriber Pipeline")
    parser.add_argument("--mode", choices=["full", "incremental"], default="full")
    parser.add_argument("--dry-run", action="store_true",
                        help="Score but do not write output files")
    parser.add_argument("--mcp-module", default=None,
                        help="Python module name that contains MCP tool callables (advanced)")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.WARNING,
        format="%(levelname)s %(name)s: %(message)s",
    )

    # ── Wire up MCP bridge ────────────────────────────────────────────────────
    bridge = None

    # Try HTTP bridge first (set when Claude Code provides MCP via HTTP)
    bridge = _make_claude_mcp_bridge()

    if bridge is None and args.mcp_module:
        try:
            import importlib
            mod = importlib.import_module(args.mcp_module)
            bridge = _make_direct_mcp_bridge(mod)
        except ImportError as exc:
            print(f"ERROR: Could not import --mcp-module '{args.mcp_module}': {exc}",
                  file=sys.stderr)
            sys.exit(1)

    if bridge is None:
        bridge = build_mcp_bridge_for_session()

    client.set_mcp_bridge(bridge)

    # ── Run pipeline ──────────────────────────────────────────────────────────
    from pipeline import run_pipeline
    run_pipeline(mode=args.mode, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
