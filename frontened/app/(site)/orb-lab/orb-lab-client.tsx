"use client";

import { useEffect, useRef, useState } from "react";
import { Orb } from "@/components/orb/orb";
import { OrbStatus } from "@/components/orb/orb-status";
import {
  ORB_SIZES,
  type OrbSizePreset,
  type OrbState,
} from "@/components/orb/orb-types";
import { Button } from "@/components/ui/button";
import { FlowBorder } from "@/components/ui/flow-border";
import { Label } from "@/components/ui/label";
import { SILENCE_LIMIT_MS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STATES: OrbState[] = [
  "idle",
  "speaking",
  "listening",
  "userSpeaking",
  "thinking",
  "error",
  "wrapup",
];

const PRESETS = Object.keys(ORB_SIZES) as OrbSizePreset[];

export function OrbLabClient() {
  const [state, setState] = useState<OrbState>("idle");
  const [preset, setPreset] = useState<OrbSizePreset>("live");
  const [useMobileSize, setUseMobileSize] = useState(false);
  const [slider, setSlider] = useState(0.35);
  const [simulateVoice, setSimulateVoice] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [dissolved, setDissolved] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(1);

  const levelRef = useRef(0.35);
  const countdownRef = useRef<number | null>(null);
  const countdownStartedAt = useRef<number | null>(null);

  const size = useMobileSize ? ORB_SIZES[preset].mobile : ORB_SIZES[preset].desktop;

  useEffect(() => {
    levelRef.current = slider;
  }, [slider]);

  useEffect(() => {
    if (!simulateVoice) return;
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      const t = (now - t0) / 1000;
      const wave = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * 6.2)) * (0.6 + 0.4 * Math.sin(t * 2.1));
      levelRef.current = Math.min(1, Math.max(0, wave));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [simulateVoice]);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const started = countdownStartedAt.current;
      if (started !== null) {
        const remaining = Math.max(0, SILENCE_LIMIT_MS - (Date.now() - started));
        countdownRef.current = remaining;
        const sec = Math.max(0, Math.ceil(remaining / 1000));
        setCountdownSeconds((prev) => (prev === sec ? prev : sec));
        if (remaining <= 0) {
          countdownStartedAt.current = null;
          countdownRef.current = null;
          setCountdownSeconds(null);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const startCountdown = () => {
    countdownStartedAt.current = Date.now();
    countdownRef.current = SILENCE_LIMIT_MS;
    setCountdownSeconds(Math.ceil(SILENCE_LIMIT_MS / 1000));
    if (state !== "listening" && state !== "userSpeaking") setState("listening");
  };

  const stopCountdown = () => {
    countdownStartedAt.current = null;
    countdownRef.current = null;
    setCountdownSeconds(null);
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-dark">Dev only</p>
        <h1 className="text-3xl font-bold text-ink">Orb lab</h1>
        <p className="max-w-2xl text-slate-dark">
          Preview IntraAI&apos;s live-interview orb. Switch states, drive loudness, and run the
          20-second silence countdown. This route 404s in production.
        </p>
      </header>

      <div
        className="relative flex min-h-[32rem] flex-col items-center justify-center overflow-visible rounded-3xl px-4 py-16"
        style={{
          background:
            "radial-gradient(circle at 50% 42%, #E6F8F1 0%, #ffffff 68%)",
        }}
      >
        <div
          className="pointer-events-none absolute left-1/2 top-[42%] h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "radial-gradient(circle, rgb(106 47 212 / 0.12), transparent 70%)" }}
          aria-hidden="true"
        />
        <Orb
          state={state}
          size={size}
          levelRef={levelRef}
          countdownRef={countdownRef}
          countdownTotalMs={SILENCE_LIMIT_MS}
          onDissolved={() => setDissolved(true)}
        />
        <OrbStatus
          className="relative z-10 mt-6"
          state={state}
          countdownSeconds={countdownSeconds}
          questionNumber={questionNumber}
          levelRef={levelRef}
        />
        {dissolved && state === "wrapup" ? (
          <p className="relative z-10 mt-2 font-mono text-sm text-emerald-dark">onDissolved fired</p>
        ) : null}
      </div>

      <FlowBorder radius={16} width={1.5} tone="deep" className="bg-white p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <Label className="text-ink">State</Label>
            <div className="flex flex-wrap gap-2">
              {STATES.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={state === s ? "secondary" : "outline"}
                  onClick={() => {
                    if (s !== "wrapup") setDissolved(false);
                    setState(s);
                  }}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-ink">Size preset</Label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((key) => (
                <Button
                  key={key}
                  size="sm"
                  variant={preset === key ? "default" : "outline"}
                  onClick={() => setPreset(key)}
                >
                  {key} ({useMobileSize ? ORB_SIZES[key].mobile : ORB_SIZES[key].desktop})
                </Button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                className="size-4 accent-brand-violet"
                checked={useMobileSize}
                onChange={(e) => setUseMobileSize(e.target.checked)}
              />
              Use mobile size
            </label>
          </div>

          <div className="space-y-3">
            <Label htmlFor="orb-level" className="text-ink">
              Level {slider.toFixed(2)}
            </Label>
            <input
              id="orb-level"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={slider}
              disabled={simulateVoice}
              onChange={(e) => setSlider(Number(e.target.value))}
              className="w-full accent-brand-violet"
            />
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                className="size-4 accent-brand-violet"
                checked={simulateVoice}
                onChange={(e) => setSimulateVoice(e.target.checked)}
              />
              Simulate AI voice
            </label>
          </div>

          <div className="space-y-3">
            <Label className="text-ink">Silence countdown</Label>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={startCountdown}>
                Start 20 s countdown
              </Button>
              <Button size="sm" variant="outline" onClick={stopCountdown}>
                Clear
              </Button>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink">
              Question
              <input
                type="number"
                min={1}
                className={cn(
                  "h-9 w-16 rounded-lg border border-slate-dark/40 bg-white px-2 font-mono text-ink"
                )}
                value={questionNumber}
                onChange={(e) => setQuestionNumber(Number(e.target.value) || 1)}
              />
            </label>
          </div>
        </div>
      </FlowBorder>
    </div>
  );
}
