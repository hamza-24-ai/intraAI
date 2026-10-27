// hooks/use-cooldown.ts
"use client";

import { useCallback, useEffect, useState } from "react";

/** Second-by-second countdown that cleans up its timer and never duplicates it. */
export function useCooldown(seconds: number) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setTimeout(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);

  const start = useCallback(() => setRemaining(seconds), [seconds]);

  return { remaining, active: remaining > 0, start };
}
