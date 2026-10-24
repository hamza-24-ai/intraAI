// src/components/home/blur-words.tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EASE } from "@/lib/motion";

interface BlurWordsProps {
  text: string;
  className?: string;
  startDelay?: number;
  stagger?: number;
}

/** Headline words blur in one by one (60 ms apart). Settled text is always sharp. */
export function BlurWords({ text, className, startDelay = 0.1, stagger = 0.06 }: BlurWordsProps) {
  const reduce = useReducedMotion();
  const words = text.split(" ");

  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className="inline-block"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, filter: "blur(12px)" }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: reduce ? 0.2 : 0.7, ease: EASE, delay: reduce ? 0 : startDelay + i * stagger }}
        >
          {word}
          {i < words.length - 1 ? "\u00A0" : ""}
        </motion.span>
      ))}
    </span>
  );
}