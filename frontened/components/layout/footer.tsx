// src/components/layout/footer.tsx
"use cache"


import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/resume", label: "Upload resume" },
  { href: "/questions", label: "Question Bank" },
  { href: "/interview/setup", label: "Interview" },
  { href: "/login", label: "Sign in" },
];

export async function Footer() {
  return (
    <footer className="bg-mint text-ink">
      <div aria-hidden className="flow-line" />
      <div className="mx-auto flex max-w-300 flex-col gap-8 px-4 py-12 md:flex-row md:justify-between md:px-10">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-slate-dark">Practice the interview before it counts.</p>
        </div>
        <ul className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-brand-violet underline-offset-4 hover:underline">{l.label}</Link>
            </li>
          ))}
        </ul>
      </div>
      <p className="mx-auto max-w-300 px-4 pb-8 text-sm text-slate-dark md:px-10">
        Built at FAST-NUCES Faisalabad · © {new Date().getFullYear()} IntraAI
      </p>
    </footer>
  );
}