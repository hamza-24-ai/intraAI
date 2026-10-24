// src/app/(site)/page.tsx  (Phase 3 mein asli Home se replace hoga)
import { Aurora } from "@/components/ui/aurora";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Reveal } from "@/components/ui/reveal";

export default function Home() {
  return (
    <section className="relative isolate px-4 py-24">
      <Aurora />
      <Reveal className="mx-auto max-w-xl">
        <GlassCard className="p-8">
          <h1 className="text-3xl font-bold">Practice the interview before it counts.</h1>
          <p className="mt-3 text-slate-dark">Setup check: the real Home page comes in Phase 3.</p>
          <Button className="mt-6">Upload your resume</Button>
        </GlassCard>
      </Reveal>
    </section>
  );
}