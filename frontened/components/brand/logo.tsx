// src/components/brand/logo.tsx
import { cn } from "@/lib/utils";
import logo from "@/public/favicon.svg";
import Image from "next/image";

/** Placeholder mark. Replace the <svg> with the real logo once you upload it. */
export function Logo({ className, withWordmark = true }: { className?: string; withWordmark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image src={logo} alt="" width={32} height={32} aria-hidden="true" />
      {withWordmark && (
        <span className="font-display text-xl font-extrabold tracking-tight text-ink">
          Intra<span className="text-brand-violet">AI</span>
        </span>
      )}
    </span>
  );
}