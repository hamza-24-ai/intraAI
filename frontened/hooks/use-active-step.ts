// hooks/use-active-step.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Which step card is crossing the middle band of the viewport. */
export function useActiveStep(count: number) {
  const elements = useRef<(HTMLElement | null)[]>(Array(count).fill(null));
  const [active, setActive] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.step));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    elements.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [count]);

  const register = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      elements.current[index] = el;
    },
    []
  );

  return { active, register };
}