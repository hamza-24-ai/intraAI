// components/auth/auth-shell.tsx
import type { ReactNode, Ref } from "react";
import { Aurora } from "@/components/ui/aurora";
import { GlassCard } from "@/components/ui/glass-card";
import { Reveal } from "@/components/ui/reveal";

interface AuthShellProps {
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  titleRef?: Ref<HTMLHeadingElement>;
}

const FULL_BLEED = "max-md:min-h-[calc(100dvh_-_4.5rem_-_env(safe-area-inset-top))]";

export function AuthShell({ title, subtitle, children, footer, titleRef }: AuthShellProps) {
  return (
    <section
      className={`relative isolate flex min-h-[calc(100dvh-4.5rem-env(safe-area-inset-top))] w-full justify-center md:items-center md:px-4 md:py-12`}
    >
      <Aurora />
      <Reveal className={`w-full md:max-w-110 ${FULL_BLEED}`}>
        <GlassCard
          className={`flex w-full flex-col p-6 md:p-8 max-md:rounded-none max-md:bg-white/90 max-md:shadow-none ${FULL_BLEED}`}
        >
          <div className="mb-6">
            <h1
              ref={titleRef}
              tabIndex={-1}
              className="font-display text-2xl font-bold text-ink md:text-3xl"
            >
              {title}
            </h1>
            {subtitle ? <p className="mt-2 text-sm text-slate-dark">{subtitle}</p> : null}
          </div>
          <div className="flex flex-1 flex-col">{children}</div>
          {footer ? <div className="mt-6 text-center text-sm text-slate-dark">{footer}</div> : null}
        </GlassCard>
      </Reveal>
    </section>
  );
}
