import type { MutableRefObject } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader,
  Mic,
  Sparkles,
  Volume2,
  type LucideIcon,
} from "lucide-react";

export type OrbState =
  | "idle"
  | "speaking"
  | "listening"
  | "userSpeaking"
  | "thinking"
  | "error"
  | "wrapup";

export interface OrbProps {
  state: OrbState;
  /** Sphere diameter in px. Layout box is size × size. Default 400. */
  size?: number;
  /** 0..1 loudness: user's mic (userSpeaking) or AI voice (speaking). */
  levelRef?: MutableRefObject<number>;
  /** Remaining ms of the silence countdown; null = hidden. */
  countdownRef?: MutableRefObject<number | null>;
  /** Default SILENCE_LIMIT_MS. */
  countdownTotalMs?: number;
  /** Default 48 on desktop, 32 when viewport < 600px. */
  rayCount?: number;
  /** Fired when the wrapup dissolve animation completes. */
  onDissolved?: () => void;
  className?: string;
}

export const ORB_SIZES = {
  homeHero: { desktop: 420, mobile: 300 },
  homeDemo: { desktop: 440, mobile: 300 },
  micTest: { desktop: 120, mobile: 120 },
  live: { desktop: 400, mobile: 260 },
  reportHeader: { desktop: 96, mobile: 96 },
  loading: { desktop: 160, mobile: 160 },
} as const;

export type OrbSizePreset = keyof typeof ORB_SIZES;

/** Client-only helper. Pass an explicit width during SSR if needed. */
export function orbSizeFor(preset: OrbSizePreset, viewportWidth = 1024): number {
  return viewportWidth < 600 ? ORB_SIZES[preset].mobile : ORB_SIZES[preset].desktop;
}

export const ORB_STATE_META: Record<
  OrbState,
  { label: string; ariaLabel: string; icon: LucideIcon }
> = {
  idle: {
    label: "Ready",
    ariaLabel: "AI interviewer orb, idle",
    icon: Sparkles,
  },
  speaking: {
    label: "AI is asking",
    ariaLabel: "AI interviewer orb, speaking",
    icon: Volume2,
  },
  listening: {
    label: "Your turn. Speak now.",
    ariaLabel: "AI interviewer orb, listening",
    icon: Mic,
  },
  userSpeaking: {
    label: "Listening...",
    ariaLabel: "AI interviewer orb, listening to you",
    icon: Mic,
  },
  thinking: {
    label: "Thinking",
    ariaLabel: "AI interviewer orb, thinking",
    icon: Loader,
  },
  error: {
    label: "Something went wrong",
    ariaLabel: "AI interviewer orb, error",
    icon: AlertTriangle,
  },
  wrapup: {
    label: "That is a wrap",
    ariaLabel: "AI interviewer orb, finished",
    icon: CheckCircle2,
  },
};

export const ORB_COLORS = {
  emerald: "#2CBF8B",
  violet: "#6A2FD4",
  violetDeep: "#4B1FA3",
  highlight: "#A68AE8",
  midpoint: "#4A7FC0",
  emeraldDark: "#0A6B4A",
  warning: "#8A5A00",
  ink: "#15171C",
  mint: "#E6F8F1",
} as const;

export const CANVAS_OVERSCAN = 2.2;
export const DEFAULT_ORB_SIZE = 400;
export const HEARTBEAT_MS = 850;
export const STATE_BLEND_MS = 360;
export const SPEAKING_SETTLE_MS = 400;
export const WRAPUP_MS = 1100;
export const MOBILE_RAY_BREAKPOINT = 600;
export const FALLBACK_RAY_COUNT = 24;

export function defaultRayCount(viewportWidth: number): number {
  return viewportWidth < MOBILE_RAY_BREAKPOINT ? 32 : 48;
}
