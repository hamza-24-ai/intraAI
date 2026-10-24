"use client";

import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";

function rmsFromTimeDomain(data: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const v = (data[i] - 128) / 128;
    sum += v * v;
  }
  return Math.sqrt(sum / data.length);
}

/** Mic loudness 0..1 written into a ref. Opens its own getUserMedia stream while enabled. */
export function useMicLevel(enabled: boolean): MutableRefObject<number> {
  const levelRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      levelRef.current = 0;
      return;
    }

    let cancelled = false;
    let ctx: AudioContext | null = null;
    let stream: MediaStream | null = null;
    let raf = 0;
    const data = new Uint8Array(256);

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const tick = () => {
          if (cancelled) return;
          analyser.getByteTimeDomainData(data);
          const boosted = Math.min(1, rmsFromTimeDomain(data) * 3.4);
          const cur = levelRef.current;
          const tau = boosted > cur ? 40 : 120;
          const a = 1 - Math.exp(-16 / tau);
          levelRef.current = cur + (boosted - cur) * a;
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        levelRef.current = 0;
      }
    };

    void start();

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      void ctx?.close();
      levelRef.current = 0;
    };
  }, [enabled]);

  return levelRef;
}
