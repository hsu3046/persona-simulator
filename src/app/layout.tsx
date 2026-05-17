import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AiSettingsProvider } from "@/components/ai-settings-provider";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Persona Simulator",
  description:
    "AI 페르소나 라이프 시뮬레이터 — 마케팅·비즈니스 의사결정을 위한 게임형 고객 시뮬레이션",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <AiSettingsProvider />
        <SiteHeader />
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
