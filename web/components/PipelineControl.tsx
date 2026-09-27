"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RunStatus } from "@/lib/storage";
import { SEGMENTS } from "@/lib/leads";

interface Props {
  onComplete: () => void;
}

export function PipelineControl({ onComplete }: Props) {
  const [status, setStatus] = useState<RunStatus | null>(null);
  const [triggering, setTriggering] = useState(false);
  // Keep a stable ref so effects that call onComplete don't re-run on every render.
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const fetchStatus = useCallback(async () => {
    const res = await fetch("/api/status");
    if (res.ok) setStatus(await res.json());
  }, []);

  // Initial load. setStatus runs after an await inside fetchStatus, so this is an
  // async data sync — not the synchronous cascading render the rule guards against.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // Poll while running
  useEffect(() => {
    if (status?.state !== "running") return;
    const id = setInterval(fetchStatus, 3000);
    return () => clearInterval(id);
  }, [status?.state, fetchStatus]);

  // Reload leads once when a run finishes (track previous state to fire exactly once).
  const prevStateRef = useRef<string | null>(null);
  useEffect(() => {
    if (status?.state === "done" && prevStateRef.current === "running") {
      onCompleteRef.current();
    }
    prevStateRef.current = status?.state ?? null;
  }, [status?.state]);

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
    const deadline = Date.now() + 20 * 60 * 1000; // 20-minute wall-clock limit
    try {
      let first = true;
      for (let i = 0; i < 250 && Date.now() < deadline; i++) {
        const res = await fetch(`/api/run-deep${first ? "?restart=1" : ""}`, { method: "POST" });
        first = false;
        if (!res.ok) break;
        const body = (await res.json()) as { done?: boolean; busy?: boolean };
        await fetchStatus();
        if (body.done) break;
        // Lock held by cron — back off before retrying.
        await new Promise((r) => setTimeout(r, body.busy ? 5000 : 500));
      }
    } finally {
      setTriggering(false);
      await fetchStatus();
    }
  };

  const isRunning = status?.state === "running" || triggering;

  return (
    <div className="mm-card flex items-center gap-4 rounded-2xl px-5 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <StatusBadge state={status?.state ?? "idle"} />
          <span className="truncate text-sm font-medium text-zinc-700">
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
        <ExportMenu />
        <button
          onClick={triggerDeepRun}
          disabled={isRunning}
          title="Scan the entire subscriber base (runs in resumable chunks)"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#F15A29]/30 bg-[#fef0eb] px-3 py-2 text-sm font-medium text-[#d94d22] transition-colors hover:bg-[#fde5db] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <DeepIcon />
          Deep Scan
        </button>
        <button
          onClick={triggerRun}
          disabled={isRunning}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#F15A29] px-4 py-2 text-sm font-semibold text-white shadow-[0_2px_8px_-2px_rgba(241,90,41,0.5)] transition-colors hover:bg-[#d94d22] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
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

// CSV export with three ready-made segments (plus "all"). Each item is a plain
// download link to /api/export?segment=… so the browser handles the file.
function ExportMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-50"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Export CSV
        <svg className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-72 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
          {SEGMENTS.map((s) => (
            <a
              key={s.id}
              href={`/api/export?segment=${s.id}`}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 transition-colors hover:bg-zinc-50"
            >
              <div className="text-sm font-medium text-zinc-800">{s.label}</div>
              <div className="text-xs text-zinc-500">{s.description}</div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ state }: { state: string }) {
  const config: Record<string, { dot: string; bg: string; text: string; label: string }> = {
    idle:    { dot: "bg-zinc-400",                  bg: "bg-zinc-100",       text: "text-zinc-600",    label: "Idle" },
    running: { dot: "bg-amber-500 animate-pulse",   bg: "bg-amber-50",       text: "text-amber-700",   label: "Running" },
    done:    { dot: "bg-emerald-500",               bg: "bg-emerald-50",     text: "text-emerald-700", label: "Done" },
    error:   { dot: "bg-red-500",                   bg: "bg-red-50",         text: "text-red-700",     label: "Error" },
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
