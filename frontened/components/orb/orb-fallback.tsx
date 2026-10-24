"use client";

import { useId } from "react";
import { fallbackRayLayout } from "@/components/orb/orb-engine";
import {
  CANVAS_OVERSCAN,
  FALLBACK_RAY_COUNT,
  ORB_COLORS,
  type OrbState,
} from "@/components/orb/orb-types";
import { cn } from "@/lib/utils";

const RAYS = fallbackRayLayout(FALLBACK_RAY_COUNT);

const GLOW: Record<OrbState, number> = {
  idle: 0.92,
  speaking: 1,
  listening: 0.94,
  userSpeaking: 0.98,
  thinking: 0.88,
  error: 0.9,
  wrapup: 0.8,
};

interface OrbFallbackProps {
  size: number;
  state?: OrbState;
  className?: string;
}

export function OrbFallback({ size, state = "idle", className }: OrbFallbackProps) {
  const uid = useId().replace(/:/g, "");
  const bodyId = `${uid}-body`;
  const specId = `${uid}-spec`;
  const rayId = `${uid}-ray`;
  const view = 100;
  const cx = 50;
  const cy = 50;
  const r = 50 / CANVAS_OVERSCAN;
  const glow = GLOW[state];
  const rayScale =
    state === "listening" || state === "thinking"
      ? 0.6
      : state === "error" || state === "wrapup"
        ? 0.15
        : 0.85;

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-visible", className)}
      aria-hidden="true"
      style={{ opacity: 0.72 + 0.28 * glow }}
    >
      <svg
        width={size * CANVAS_OVERSCAN}
        height={size * CANVAS_OVERSCAN}
        viewBox={`0 0 ${view} ${view}`}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible"
      >
        <defs>
          <radialGradient id={bodyId} cx="32%" cy="28%" r="70%">
            <stop offset="0%" stopColor={ORB_COLORS.highlight} />
            <stop offset="45%" stopColor={ORB_COLORS.violet} />
            <stop offset="100%" stopColor={ORB_COLORS.violetDeep} />
          </radialGradient>
          <radialGradient id={specId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <linearGradient id={rayId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={ORB_COLORS.midpoint} stopOpacity="0.85" />
            <stop offset="100%" stopColor={ORB_COLORS.midpoint} stopOpacity="0" />
          </linearGradient>
        </defs>
        <ellipse
          cx={cx}
          cy={cy + r * 0.92}
          rx={r * 0.72}
          ry={r * 0.18}
          fill={ORB_COLORS.violet}
          opacity={0.18}
        />
        {RAYS.map((ray, i) => {
          const x0 = cx + Math.cos(ray.angle) * r;
          const y0 = cy + Math.sin(ray.angle) * r;
          const x1 = cx + Math.cos(ray.angle) * (r + r * ray.length * rayScale);
          const y1 = cy + Math.sin(ray.angle) * (r + r * ray.length * rayScale);
          return (
            <line
              key={i}
              x1={x0}
              y1={y0}
              x2={x1}
              y2={y1}
              stroke={`url(#${rayId})`}
              strokeWidth={0.7}
              strokeLinecap="round"
            />
          );
        })}
        <circle cx={cx} cy={cy} r={r} fill={`url(#${bodyId})`} />
        <ellipse
          cx={cx - r * 0.22}
          cy={cy - r * 0.26}
          rx={r * 0.3}
          ry={r * 0.22}
          fill={`url(#${specId})`}
          transform={`rotate(-25 ${cx - r * 0.22} ${cy - r * 0.26})`}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth={0.6}
        />
        <ellipse
          cx={cx}
          cy={cy}
          rx={r * 1.15}
          ry={r * 1.15 * Math.cos((65 * Math.PI) / 180)}
          fill="none"
          stroke={ORB_COLORS.violet}
          strokeOpacity={0.3}
          strokeWidth={0.35}
          transform={`rotate(-18 ${cx} ${cy})`}
        />
        {state === "error" ? (
          <circle
            cx={cx}
            cy={cy}
            r={r * 1.12}
            fill="none"
            stroke={ORB_COLORS.warning}
            strokeWidth={0.7}
            strokeDasharray="2.2 1.8"
          />
        ) : null}
      </svg>
    </div>
  );
}
