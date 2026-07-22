import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aegis-OS — Resilient Spatial Inspection",
  description: "A deterministic local spatial inspection workspace that locates visible faults, verifies correction, requires human approval, and creates checksummed reports.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}><body className="min-h-full flex flex-col">{children}</body></html>;
}
