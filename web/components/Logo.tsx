"use client";

import { useState } from "react";

const LOGO_URL =
  "https://media.beehiiv.com/cdn-cgi/image/format=auto,onerror=redirect/uploads/asset/file/bb859cde-cb72-45a8-81da-08c033223e2c/Logo_by_rwazi__1_.png";

/** Official Market Mosaic logo. Falls back to SVG recreation if CDN is unreachable. */
export function MarketMosaicLogo({
  tone = "light",
  className = "",
}: {
  tone?: "light" | "dark";
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!failed) {
    return (
      // Plain <img> on purpose: the onError handler degrades to the SVG lockup
      // if the CDN is unreachable — a fallback next/image doesn't support cleanly.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={LOGO_URL}
        alt="Market Mosaic by Rwazi"
        onError={() => setFailed(true)}
        className={`h-9 w-auto object-contain ${className}`}
      />
    );
  }

  // Fallback SVG lockup
  const word = tone === "light" ? "text-white" : "text-zinc-900";
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <MarketMosaicMark className="h-9 w-9 shrink-0" />
      <span className="flex items-center gap-1.5">
        <span className={`font-extrabold uppercase leading-[0.92] tracking-tight ${word}`}>
          <span className="block text-[15px]">Market</span>
          <span className="block text-[15px]">Mosaic</span>
        </span>
        <span className={`text-sm font-bold ${word}`}>
          By <span className="lowercase text-[#F15A29]">rwazi</span>
        </span>
      </span>
    </span>
  );
}

function MarketMosaicMark({ className = "h-9 w-9" }: { className?: string }) {
  const cx = 50, cy = 50;
  const dots: { cx: number; cy: number; r: number }[] = [{ cx, cy, r: 5 }];
  const rings = [
    { count: 8, radius: 17, r: 4.1, offset: 0 },
    { count: 14, radius: 31, r: 3.6, offset: Math.PI / 14 },
  ];
  for (const ring of rings) {
    for (let i = 0; i < ring.count; i++) {
      const a = (i / ring.count) * Math.PI * 2 + ring.offset;
      dots.push({ cx: cx + ring.radius * Math.cos(a), cy: cy + ring.radius * Math.sin(a), r: ring.r });
    }
  }
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <rect width="100" height="100" rx="22" fill="#F15A29" />
      {dots.map((d, i) => <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill="#fff" />)}
    </svg>
  );
}

