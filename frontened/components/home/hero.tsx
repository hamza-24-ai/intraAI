// src/components/home/hero.tsx
import Link from "next/link";
import { Upload } from "lucide-react";
import { BlurWords } from "@/components/home/blur-words";
import { HeroVisual } from "@/components/home/hero-visual";
import { HexGrid } from "@/components/home/hex-grid";
import { Section } from "@/components/home/section";
import { Aurora } from "@/components/ui/aurora";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

export function Hero() {
  return (
    <Section tone="mint" className="py-10 md:py-16 lg:py-20">
      <Aurora />
      <HexGrid />

      <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <h1 className="text-[40px] font-extrabold leading-11.5 tracking-[-0.02em] md:text-[64px] md:leading-18">
            <BlurWords text="Practice the interview" />{" "}
            <BlurWords text="before it counts." className="text-brand-violet" startDelay={0.28} />
          </h1>

          <Reveal className="mt-6 max-w-xl">
            <p className="text-[17px] leading-6.75 md:text-lg md:leading-7">
              Upload your resume, speak your answers, and get honest feedback. Free, no login.
            </p>
          </Reveal>

          <Reveal index={1} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button  size="lg" className="w-full sm:w-auto">
              <Link href="/resume">
                <Upload /> Upload your resume
              </Link>
            </Button>
            <Button  size="lg" variant="secondary" className="w-full sm:w-auto">
              <Link href="#how-it-works">See how it works</Link>
            </Button>
          </Reveal>

          <Reveal index={2} className="mt-4">
            <p className="text-sm text-slate-dark">
              PDF or DOCX, up to 5 MB. We only read skills, projects and your target role.
            </p>
          </Reveal>
        </div>

        {/* visual first on mobile */}
        <div className="order-first lg:order-last lg:col-span-5">
          <HeroVisual />
        </div>
      </div>
    </Section>
  );
}