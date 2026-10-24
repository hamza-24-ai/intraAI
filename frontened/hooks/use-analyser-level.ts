"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import type { MutableRefObject } from "react";

function rmsFromTimeDomain(data: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const v = (data[i] - 128) / 128;
    sum += v * v;
  }
  return Math.sqrt(sum / data.length);
}

/** Smoothed 0..1 RMS of an existing AnalyserNode (AI voice playback). */
export function useAnalyserLevel(
  getAnalyser: () => AnalyserNode | null,
  enabled: boolean
): MutableRefObject<number> {
  const levelRef = useRef(0);
  const getAnalyserRef = useRef(getAnalyser);
  useLayoutEffect(() => {
    getAnalyserRef.current = getAnalyser;
  });

  useEffect(() => {
    if (!enabled) {
      levelRef.current = 0;
      return;
    }

    let raf = 0;
    let buffer = new Uint8Array(2048);

    const tick = () => {
      const analyser = getAnalyserRef.current();
      if (analyser) {
        if (buffer.length !== analyser.fftSize) buffer = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(buffer);
        const boosted = Math.min(1, rmsFromTimeDomain(buffer) * 3.2);
        const cur = levelRef.current;
        const tau = boosted > cur ? 40 : 120;
        const a = 1 - Math.exp(-16 / tau);
        levelRef.current = cur + (boosted - cur) * a;
      } else {
        levelRef.current = 0;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      levelRef.current = 0;
    };
  }, [enabled]);

  return levelRef;
}
