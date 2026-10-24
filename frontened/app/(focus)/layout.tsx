// app/(focus)/layout.tsx  (live interview: global navigation hidden)
export default function FocusLayout({ children }: { children: React.ReactNode }) {
  return <main id="main" className="min-h-dvh">{children}</main>;
}