/**
 * Rwazi / Market Mosaic brand mark — the orange asterisk-flower used on
 * newsletter.rwazi.com. Eight tapered petals radiating from a center,
 * rendered in the Market Mosaic coral-orange.
 */
export function RwaziMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <g fill="#e8553a">
        {/* eight petals, each a thin rounded teardrop, rotated around center */}
        {Array.from({ length: 8 }).map((_, i) => (
          <rect
            key={i}
            x="14.6"
            y="2"
            width="2.8"
            height="13"
            rx="1.4"
            transform={`rotate(${i * 45} 16 16)`}
          />
        ))}
        <circle cx="16" cy="16" r="3.1" />
      </g>
    </svg>
  );
}

/**
 * Full Market Mosaic lockup: mark + "Market Mosaic" wordmark with the
 * "by Rwazi" descriptor. `tone` adapts text color for dark vs light bands.
 */
export function MarketMosaicLogo({
  tone = "light",
  className = "",
}: {
  tone?: "light" | "dark";
  className?: string;
}) {
  const title = tone === "light" ? "text-white" : "text-zinc-900";
  const sub = tone === "light" ? "text-zinc-400" : "text-zinc-500";
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <RwaziMark className="h-7 w-7 shrink-0" />
      <span className="leading-none">
        <span className={`block text-base font-bold tracking-tight ${title}`}>Market Mosaic</span>
        <span className={`block text-[11px] font-medium ${sub}`}>by Rwazi</span>
      </span>
    </span>
  );
}
