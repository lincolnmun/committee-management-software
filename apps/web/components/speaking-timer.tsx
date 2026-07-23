"use client";

import { useEffect, useState } from "react";

// Derives remaining time from the shared called_at timestamp + duration,
// rather than starting a client-local countdown — so every viewer's clock
// stays in sync with the same underlying moment, not whenever their own
// browser happened to render this component.
export function SpeakingTimer({
  calledAt,
  speakingSeconds,
}: {
  calledAt: string;
  speakingSeconds: number;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsed = Math.floor((now - new Date(calledAt).getTime()) / 1000);
  const remaining = Math.max(speakingSeconds - elapsed, 0);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <span
      className={`font-mono text-lg tabular-nums ${remaining === 0 ? "text-red-600" : ""}`}
    >
      {minutes}:{seconds.toString().padStart(2, "0")}
    </span>
  );
}
