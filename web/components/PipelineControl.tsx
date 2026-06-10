"use client";

import { useState, useEffect, useCallback } from "react";
import { RunStatus } from "@/lib/storage";

interface Props {
  onComplete: () => void;
}

export function PipelineControl({ onComplete }: Props) {
  const [status, setStatus] = useState<RunStatus | null>(null);
  const [triggering, setTriggering] = useState(false);

  const fetchStatus = useCallback(async () => {
    const res = await fetch("/api/status");
    if (res.ok) setStatus(await res.json());
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Poll while running
  useEffect(() => {
    if (status?.state !== "running") return;
    const id = setInterval(async () => {
      await fetchStatus();
    }, 3000);
    return () => clearInterval(id);
  }, [status?.state, fetchStatus]);

  // Reload leads when done
  useEffect(() => {
    if (status?.state === "done") onComplete();
  }, [status?.state, onComplete]);

  const triggerRun = async () => {
    setTriggering(true);
    await fetch("/api/run", { method: "POST" });
    setTriggering(false);
    fetchStatus();
  };

  // Deep scan: loop the chunked endpoint until the job reports done. Each call
  // does one time-bounded slice server-side, so this never trips the 60s limit.
  const triggerDeepRun = async () => {
    setTriggering(true);
    try {
      let first = true;
      // guard against an unexpected runaway; ~250 chunks is plenty for 129K
      for (let i = 0; i < 250; i++) {
        const res = await fetch(`/api/run-deep${first ? "?restart=1" : ""}`, { method: "POST" });
        first = false;
        await fetchStatus();
        onComplete();
        if (!res.ok) break;
        const body = (await res.json()) as { done?: boolean; busy?: boolean };
        if (body.done) break;
        // Another worker (e.g. the cron) holds the lock — back off, then retry.
        if (body.busy) await new Promise((r) => setTimeout(r, 5000));
      }
    } finally {
      setTriggering(false);
      fetchStatus();
      onComplete();
    }
  };

  const isRunning = status?.state === "running" || triggering;

  return (
    <div className="sena-card flex items-center gap-4 rounded-2xl border border-white/[0.07] px-5 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <StatusBadge state={status?.state ?? "idle"} />
          <span className="truncate text-sm font-medium text-zinc-300">
            {status?.message ?? "Ready to scan for decision-makers"}
          </span>
        </div>
        {status?.finishedAt && status.state === "done" && (
          <p className="mt-1 text-xs text-zinc-500">
            Finished{" "}
            {new Date(status.finishedAt).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>

      <div className="flex shrink-0 gap-2">
        <a
          href="/api/export"
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export CSV
        </a>
        <button
          onClick={triggerDeepRun}
          disabled={isRunning}
          title="Scan the entire subscriber base (runs in resumable chunks)"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#7df59e]/30 bg-[#7df59e]/10 px-3 py-2 text-sm font-medium text-[#7df59e] transition-colors hover:bg-[#7df59e]/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <DeepIcon />
          Deep Scan
        </button>
        <button
          onClick={triggerRun}
          disabled={isRunning}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#7df59e] px-4 py-2 text-sm font-semibold text-[#08070d] shadow-[0_0_20px_-4px_rgba(125,245,158,0.5)] transition-colors hover:bg-[#6ce28d] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {isRunning ? (
            <>
              <SpinnerIcon />
              Running…
            </>
          ) : (
            <>
              <PlayIcon />
              Run Pipeline
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ state }: { state: string }) {
  const config: Record<string, { dot: string; bg: string; text: string; label: string }> = {
    idle:    { dot: "bg-zinc-500",                  bg: "bg-white/5",        text: "text-zinc-400",    label: "Idle" },
    running: { dot: "bg-amber-400 animate-pulse",   bg: "bg-amber-400/10",   text: "text-amber-300",   label: "Running" },
    done:    { dot: "bg-[#7df59e]",                 bg: "bg-[#7df59e]/10",   text: "text-[#7df59e]",   label: "Done" },
    error:   { dot: "bg-red-400",                   bg: "bg-red-400/10",     text: "text-red-300",     label: "Error" },
  };
  const c = config[state] ?? config.idle;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function PlayIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function DeepIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v6c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      <path d="M3 11v6c0 1.66 4 3 9 3s9-1.34 9-3v-6" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
