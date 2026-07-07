import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ChatProvider } from "@/context/ChatContext";
import InterviewLiveHost from "@/components/InterviewLiveHost";
import AppShell from "@/components/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Campus AI · MIT Bengaluru",
  description:
    "The intelligent campus workspace for MIT Bengaluru — placements, interview practice, and campus knowledge.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans h-dvh overflow-hidden bg-slate-50 text-slate-900 antialiased`}
      >
        <ChatProvider>
          <AppShell>{children}</AppShell>

          {/* Global immersive Interview Mode overlay (launched from the sidebar) */}
          <InterviewLiveHost />
        </ChatProvider>
      </body>
    </html>
  );
}
