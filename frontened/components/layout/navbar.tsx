// components/layout/navbar.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { logout } from "@/lib/api/auth";
import { cn } from "@/lib/utils";
import { selectIsAuthenticated, useAuthStore } from "@/stores/auth-store";

const LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/questions", label: "Question Bank" },
  { href: "/interview/setup", label: "Interview" },
  { href: "/history", label: "History" },
];

export function Navbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const ready = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const linkClass = "font-medium text-ink underline-offset-4 hover:text-brand-violet hover:underline";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)] transition-[background-color,box-shadow] duration-300 py-4",
        scrolled ? "bg-white/85 shadow-md backdrop-blur-xl" : "bg-transparent"
      )}
    >
      <nav aria-label="Main" className="mx-auto flex h-4.5rem max-w-300 items-center justify-between px-4 md:px-10">
        <Link href="/" aria-label="IntraAI home">
          <Logo />
        </Link>

        <ul className="hidden items-center gap-8 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className={linkClass}>{l.label}</Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          {ready &&
            (isAuthenticated ? (
              <Button variant="ghost" onClick={handleLogout}>Sign out</Button>
            ) : (
              <Button  variant="ghost"><Link href="/login">Sign in</Link></Button>
            ))}
          <Button ><Link href="/resume">Upload resume</Link></Button>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-sm bg-white">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <ul className="mt-12 flex flex-col gap-2 px-4">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <SheetClose asChild>
                    <Link href={l.href} className={cn(linkClass, "flex h-12 items-center text-lg")}>{l.label}</Link>
                  </SheetClose>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-col gap-3 px-4">
              <SheetClose asChild>
                <Button  size="lg" className="w-full"><Link href="/resume">Upload resume</Link></Button>
              </SheetClose>
              {ready &&
                (isAuthenticated ? (
                  <SheetClose asChild>
                    <Button variant="outline" size="lg" className="w-full" onClick={handleLogout}>Sign out</Button>
                  </SheetClose>
                ) : (
                  <SheetClose asChild>
                    <Button  variant="outline" size="lg" className="w-full"><Link href="/login">Sign in</Link></Button>
                  </SheetClose>
                ))}
            </div>
          </SheetContent>
        </Sheet>
      </nav>

      {/* <div aria-hidden className={cn("flow-line transition-opacity duration-300", scrolled ? "opacity-100" : "opacity-0")} /> */}
    </header>
  );
}