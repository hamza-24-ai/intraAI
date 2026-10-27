// components/auth/verify-illustrations.tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";

const SIZE = 140;

function useGradientId() {
  return `verify-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

/** Brand hexagon frame shared by all verification illustrations. */
function HexFrame({ gradientId }: { gradientId: string }) {
  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="14" y1="10" x2="126" y2="130" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6A2FD4" />
          <stop offset="0.5" stopColor="#4A7FC0" />
          <stop offset="1" stopColor="#2CBF8B" />
        </linearGradient>
      </defs>
      <path
        d="M70 6 128 39v62L70 134 12 101V39Z"
        fill={`url(#${gradientId})`}
        fillOpacity="0.08"
        stroke={`url(#${gradientId})`}
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </>
  );
}

function Illustration({ children }: { children: React.ReactNode }) {
  return (
    <div aria-hidden className="flex justify-center">
      <svg width={SIZE} height={SIZE} viewBox="0 0 140 140" focusable="false">
        {children}
      </svg>
    </div>
  );
}

export function EnvelopeIllustration() {
  const reduce = useReducedMotion();
  const gradientId = useGradientId();

  return (
    <Illustration>
      <HexFrame gradientId={gradientId} />
      <motion.g
        initial={false}
        animate={reduce ? { y: 0 } : { y: [0, -6, 0] }}
        transition={reduce ? { duration: 0 } : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="42" y="55" width="56" height="38" rx="6" fill="#ffffff" stroke="#4A7FC0" strokeWidth="3" />
        <path
          d="m44 60 26 19 26-19"
          fill="none"
          stroke="#6A2FD4"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.g>
    </Illustration>
  );
}

export function CheckIllustration() {
  const reduce = useReducedMotion();
  const gradientId = useGradientId();

  return (
    <Illustration>
      <HexFrame gradientId={gradientId} />
      <circle cx="70" cy="70" r="26" fill="#E6F8F1" stroke="#2CBF8B" strokeWidth="3" />
      <motion.path
        d="m58 71 8 8 17-18"
        fill="none"
        stroke="#0A6B4A"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={reduce ? { duration: 0 } : { duration: 0.6, ease: "easeOut" }}
      />
    </Illustration>
  );
}

export function WarningIllustration() {
  const gradientId = useGradientId();

  return (
    <Illustration>
      <HexFrame gradientId={gradientId} />
      <path d="M70 48 94 92H46Z" fill="#FFF4D6" stroke="#8A5A00" strokeWidth="3" strokeLinejoin="round" />
      <path d="M70 63v13" stroke="#8A5A00" strokeWidth="5" strokeLinecap="round" />
      <circle cx="70" cy="84" r="2.5" fill="#8A5A00" />
    </Illustration>
  );
}
