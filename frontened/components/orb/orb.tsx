"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { AlertTriangle } from "lucide-react";
import { OrbFallback } from "@/components/orb/orb-fallback";
import { OrbRenderer } from "@/components/orb/orb-engine";
import {
  CANVAS_OVERSCAN,
  DEFAULT_ORB_SIZE,
  ORB_COLORS,
  ORB_STATE_META,
  defaultRayCount,
  type OrbProps,
} from "@/components/orb/orb-types";
import { SILENCE_LIMIT_MS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const GLOW_BY_STATE = {
  idle: 0.92,
  speaking: 1,
  listening: 0.94,
  userSpeaking: 0.98,
  thinking: 0.88,
  error: 0.9,
  wrapup: 0.8,
} as const;

const emptySubscribe = () => () => undefined;

function useIsClient(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

function subscribeReducedMotion(onChange: () => void): () => void {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}

export function Orb({
  state,
  size = DEFAULT_ORB_SIZE,
  levelRef,
  countdownRef,
  countdownTotalMs = SILENCE_LIMIT_MS,
  rayCount,
  onDissolved,
  className,
}: OrbProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const rendererRef = useRef<OrbRenderer | null>(null);
  const onDissolvedRef = useRef(onDissolved);
  const dissolvedFired = useRef(false);
  const stateRef = useRef(state);
  const levelHolder = useRef(levelRef);
  const countdownHolder = useRef(countdownRef);
  const isClient = useIsClient();
  const reducedMotion = usePrefersReducedMotion();
  const [canvasOk, setCanvasOk] = useState(true);

  useLayoutEffect(() => {
    stateRef.current = state;
    onDissolvedRef.current = onDissolved;
    levelHolder.current = levelRef;
    countdownHolder.current = countdownRef;
  });

  useEffect(() => {
    dissolvedFired.current = false;
  }, [state]);

  useEffect(() => {
    const box = boxRef.current;
    if (!isClient || reducedMotion || !canvasOk) {
      box?.setAttribute("data-orb-loop", isClient ? "static" : "ssr");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas || !box) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      setCanvasOk(false);
      box.setAttribute("data-orb-loop", "static");
      return;
    }

    const renderer = new OrbRenderer(ctx);
    rendererRef.current = renderer;
    renderer.setRayCount(rayCount ?? defaultRayCount(window.innerWidth));
    renderer.resize(size, Math.min(2, window.devicePixelRatio || 1));
    renderer.setState(stateRef.current, performance.now());

    let raf = 0;
    let running = false;
    let visible = true;
    let tabVisible = document.visibilityState === "visible";
    const ring = ringRef.current;
    const glow = glowRef.current;
    const radius = (size / 2) * 1.12;
    const circ = 2 * Math.PI * radius;
    if (ring) ring.setAttribute("stroke-dasharray", String(circ));

    const setLoop = (next: "running" | "paused") => {
      box.setAttribute("data-orb-loop", next);
    };

    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      running = false;
      setLoop("paused");
    };

    const frame = (now: number) => {
      renderer.setState(stateRef.current, now);
      const info = renderer.tick(
        now,
        levelHolder.current?.current ?? 0,
        countdownHolder.current?.current ?? null,
        countdownTotalMs
      );
      if (glow) {
        glow.style.opacity = String(0.55 + 0.45 * info.glowMul);
        glow.style.transform = `translate(-50%, calc(-50% + ${info.bobY}px))`;
      }
      if (ring) {
        if (!info.countdownActive) {
          ring.style.opacity = "0";
        } else {
          ring.style.opacity = "1";
          ring.style.stroke = info.countdownWarning ? ORB_COLORS.warning : ORB_COLORS.emeraldDark;
          ring.setAttribute("stroke-dashoffset", String(circ * (1 - info.countdownRatio)));
        }
      }
      if (info.dissolved && !dissolvedFired.current) {
        dissolvedFired.current = true;
        onDissolvedRef.current?.();
      }
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || !visible || !tabVisible) return;
      running = true;
      setLoop("running");
      raf = requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      },
      { threshold: 0.01 }
    );
    io.observe(box);

    const onVis = () => {
      tabVisible = document.visibilityState === "visible";
      if (tabVisible) start();
      else stop();
    };
    document.addEventListener("visibilitychange", onVis);

    const applySize = () => {
      if (rayCount == null) renderer.setRayCount(defaultRayCount(window.innerWidth));
      renderer.resize(size, Math.min(2, window.devicePixelRatio || 1));
    };
    const ro = new ResizeObserver(applySize);
    ro.observe(box);
    window.addEventListener("resize", applySize);

    start();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("resize", applySize);
      document.removeEventListener("visibilitychange", onVis);
      rendererRef.current = null;
    };
  }, [isClient, reducedMotion, canvasOk, size, rayCount, countdownTotalMs]);

  useEffect(() => {
    if (!reducedMotion || !isClient) return;
    const ring = ringRef.current;
    const glow = glowRef.current;
    const radius = (size / 2) * 1.12;
    const circ = 2 * Math.PI * radius;
    if (glow) glow.style.opacity = String(GLOW_BY_STATE[state]);

    const updateRing = () => {
      if (!ring) return;
      const remaining = countdownHolder.current?.current ?? null;
      if (remaining === null) {
        ring.style.opacity = "0";
        return;
      }
      ring.style.opacity = "1";
      ring.style.stroke = remaining <= 5000 ? ORB_COLORS.warning : ORB_COLORS.emeraldDark;
      ring.setAttribute("stroke-dasharray", String(circ));
      ring.setAttribute("stroke-dashoffset", String(circ * (1 - remaining / countdownTotalMs)));
    };
    updateRing();
    const timer = window.setInterval(updateRing, 250);
    if (state === "wrapup" && !dissolvedFired.current) {
      dissolvedFired.current = true;
      onDissolvedRef.current?.();
    }
    return () => window.clearInterval(timer);
  }, [reducedMotion, isClient, state, size, countdownTotalMs]);

  const useFallback = !isClient || reducedMotion || !canvasOk;
  const overlay = size * CANVAS_OVERSCAN;
  const ringR = (size / 2) * 1.12;
  const ringC = overlay / 2;
  const circ = 2 * Math.PI * ringR;

  return (
    <div
      ref={boxRef}
      role="img"
      aria-label={ORB_STATE_META[state].ariaLabel}
      className={cn("relative", className)}
      style={{ width: size, height: size }}
    >
      <div
        ref={glowRef}
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 rounded-full"
        style={{
          width: size * 1.9,
          height: size * 1.9,
          background: "radial-gradient(circle, rgb(106 47 212 / 0.28), transparent 70%)",
          transform: "translate(-50%, -50%)",
          opacity: GLOW_BY_STATE[state],
        }}
        aria-hidden="true"
      />

      {useFallback ? <OrbFallback size={size} state={state} /> : null}

      <canvas
        ref={canvasRef}
        className={cn(
          "pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          useFallback && "hidden"
        )}
        style={{ width: overlay, height: overlay }}
        aria-hidden="true"
      />

      <svg
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible"
        width={overlay}
        height={overlay}
        aria-hidden="true"
      >
        <circle
          ref={ringRef}
          cx={ringC}
          cy={ringC}
          r={ringR}
          fill="none"
          stroke={ORB_COLORS.emeraldDark}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={0}
          transform={`rotate(-90 ${ringC} ${ringC})`}
          style={{ opacity: 0 }}
        />
      </svg>

      {state === "error" ? (
        <span
          className="absolute right-[12%] top-[12%] flex size-9 items-center justify-center rounded-full border-2 border-warning bg-warning-tint text-warning"
          aria-hidden="true"
        >
          <AlertTriangle className="size-5" />
        </span>
      ) : null}
    </div>
  );
}
