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

  const isRunning = status?.state === "running" || triggering;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <StatusDot state={status?.state ?? "idle"} />
          <span className="text-sm font-medium text-gray-700 truncate">
            {status?.message ?? "Ready to run"}
          </span>
        </div>
        {status?.finishedAt && status.state === "done" && (
          <p className="mt-0.5 text-xs text-gray-400">
            Finished {new Date(status.finishedAt).toLocaleString()}
          </p>
        )}
      </div>

      <div className="flex gap-2 shrink-0">
        <a
          href="/api/export"
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Export CSV
        </a>
        <button
          onClick={triggerRun}
          disabled={isRunning}
          className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isRunning ? (
            <span className="flex items-center gap-1.5">
              <SpinnerIcon />
              Running…
            </span>
          ) : (
            "Run Pipeline"
          )}
        </button>
      </div>
    </div>
  );
}

function StatusDot({ state }: { state: string }) {
  const cls = {
    idle: "bg-gray-300",
    running: "bg-amber-400 animate-pulse",
    done: "bg-emerald-500",
    error: "bg-red-500",
  }[state] ?? "bg-gray-300";
  return <span className={`inline-block h-2 w-2 rounded-full ${cls}`} />;
}

function SpinnerIcon() {
  return (
    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
  );
}
