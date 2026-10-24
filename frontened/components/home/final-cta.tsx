// src/components/home/final-cta.tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Upload } from "lucide-react";
import Link from "next/link";
import { Section } from "@/components/home/section";
import { Button } from "@/components/ui/button";
import { EASE } from "@/lib/motion";

export function FinalCta() {
  const reduce = useReducedMotion();

  return (
    <Section tone="violet" className="py-16 md:py-20 lg:py-28">
      {/* soft Midpoint glow (white text stays above 4.5:1 on it) */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-140 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(74,127,192,0.55), transparent 70%)" }}
      />

      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92, filter: "blur(16px)" }}
        whileInView={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, filter: "blur(0px)" }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="mx-auto max-w-2xl text-center"
      >
        <h2 className="text-[26px] font-bold leading-8.5 text-white md:text-5xl md:leading-14">
          Your next interview starts here.
        </h2>
        <p className="mt-4 text-lg text-white">
          Upload your resume, speak your answers, get honest feedback. Free, no login.
        </p>
        <Button size="lg" className="mt-8 w-full sm:w-auto">
          <Link href="/resume">
            <Upload /> Upload your resume
          </Link>
        </Button>
      </motion.div>
    </Section>
  );
}