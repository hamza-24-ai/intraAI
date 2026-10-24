// src/components/ui/aurora.tsx
import { cn } from "@/lib/utils";

/** Put it inside a `relative isolate` section. Text must stay on Mint/glass, not on the blobs. */
export function Aurora({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
      <div className="aurora-blob aurora-emerald" />
      <div className="aurora-blob aurora-violet" />
      <div className="aurora-blob aurora-mid" />
    </div>
  );
}