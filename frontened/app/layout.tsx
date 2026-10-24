// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
// import {Navbar} from "@/components/layout/navbar";   // apne file ke naam/path ke hisab se
// import {Footer} from "@/components/layout/footer";
import "./globals.css";
import { Providers } from "@/components/providers";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", weight: ["600", "700", "800"], display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: { default: "IntraAI: Practice the interview before it counts", template: "%s | IntraAI" },
  description: "Upload your resume, speak your answers, and get honest feedback. Free, no login.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#E6F8F1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${inter.variable} ${jetbrains.variable}`}>
      <body className="min-h-dvh">
        {/* <Navbar /> */}
        <Providers>{children}</Providers>
        {/* <Footer /> */}
      </body>
    </html>
  );
}