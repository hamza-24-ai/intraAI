// src/components/home/hex-grid.tsx
"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useEffect, useId } from "react";
import { cn } from "@/lib/utils";

/** Faint hexagon grid (from the logo shape) that drifts about 12 px with the pointer (desktop only). */
export function HexGrid({ className }: { className?: string }) {
  const patternId = useId().replace(/:/g, "");
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 60, damping: 20 });
  const y = useSpring(my, { stiffness: 60, damping: 20 });

  useEffect(() => {
    if (reduce || !window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (e: PointerEvent) => {
      mx.set((e.clientX / window.innerWidth - 0.5) * 24);
      my.set((e.clientY / window.innerHeight - 0.5) * 24);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce, mx, my]);

  return (
    <motion.div
      aria-hidden
      style={{ x, y }}
      className={cn(
        "pointer-events-none absolute -inset-8 -z-10 mask-[radial-gradient(ellipse_at_center,black_30%,transparent_75%)]",
        className
      )}
    >
      <svg className="size-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={patternId} width="34.64" height="60" patternUnits="userSpaceOnUse">
            <path
              d="M17.32 0 L34.64 10 V30 L17.32 40 L0 30 V10 Z M17.32 40 V60"
              fill="none"
              stroke="#6A2FD4"
              strokeOpacity="0.16"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </motion.div>
  );
}