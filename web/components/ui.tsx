"use client";

// Small presentational primitives shared across the launch-readiness dashboard.

export function ProgressRing({
  fraction,
  size = 64,
  stroke = 6,
  color = "#F15A29",
  track = "rgba(0,0,0,0.08)",
  children,
}: {
  fraction: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, fraction));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          style={{ transition: "stroke-dashoffset 500ms ease, stroke 300ms ease" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">{children}</span>
    </div>
  );
}

export function CheckRow({
  checked,
  onToggle,
  children,
  readOnly = false,
}: {
  checked: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
  readOnly?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={readOnly ? undefined : onToggle}
      aria-pressed={checked}
      disabled={readOnly}
      className={`group flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors ${
        readOnly ? "cursor-default" : "hover:bg-zinc-50"
      }`}
    >
      <span
        className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors ${
          checked
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-zinc-300 bg-white text-transparent group-hover:border-zinc-400"
        }`}
      >
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      <span className={`text-sm leading-snug ${checked ? "text-zinc-400 line-through decoration-zinc-300" : "text-zinc-700"}`}>
        {children}
      </span>
    </button>
  );
}

export function OwnerChip({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-600">
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#fef0eb] text-[8px] font-bold text-[#d94d22]">{initials}</span>
      {name}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#d94d22]">{eyebrow}</p>}
        <h2 className="text-xl font-bold tracking-tight text-zinc-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}
