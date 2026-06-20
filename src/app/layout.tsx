import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"]
});

export const metadata: Metadata = {
  title: "Energy Lead Triage",
  description: "Zero-cost heuristic website lead triage for Türkiye energy-sector businesses."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
