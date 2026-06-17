import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Market Mosaic uses the native system-ui stack (no custom font loaded).
// Only load a monospace font for the email column in the table.
const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Sena Launch Readiness — Rwazi",
  description:
    "Internal launch-readiness command center for Sena · Track the launch gates, milestones, and proof needed before we pick a launch date · Rwazi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-zinc-900 antialiased">{children}</body>
    </html>
  );
}
