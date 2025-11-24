import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QUANTUM TRADE NEXUS - Trading Platform",
  description: "Modern trading platform with real-time market data",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


