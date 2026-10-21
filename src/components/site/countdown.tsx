"use client";

import { useEffect, useState } from "react";

/** Seconds left until midnight in Lahore (PKT, UTC+5, no DST). */
function secondsToMidnightPKT() {
  const nowPkt = Date.now() + 5 * 3600 * 1000;
  const day = 24 * 3600 * 1000;
  return Math.floor((day - (nowPkt % day)) / 1000);
}

const pad = (n: number) => String(n).padStart(2, "0");

export function Countdown({ className }: { className?: string }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    setLeft(secondsToMidnightPKT());
    const t = setInterval(() => setLeft(secondsToMidnightPKT()), 1000);
    return () => clearInterval(t);
  }, []);

  const parts = left === null ? ["--", "--", "--"] : [pad(Math.floor(left / 3600)), pad(Math.floor((left % 3600) / 60)), pad(left % 60)];

  return (
    <span className={className} role="timer" aria-label="Time left on today's deal">
      {parts.map((p, i) => (
        <span key={i} className="inline-flex items-center">
          <span className="min-w-[2ch] rounded bg-ink px-1.5 py-0.5 text-center tabular-nums text-white">{p}</span>
          {i < 2 && <span className="px-0.5 opacity-50">:</span>}
        </span>
      ))}
    </span>
  );
}
