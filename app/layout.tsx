import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PlausibleProvider from "next-plausible";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MemeFast.fun | Create Solana Tokens in Seconds",
  description:
    "MemeFast.fun | Create Solana Tokens in Seconds. No coding required. Launch tokens, manage authorities, and set up liquidity pools easily.",
  keywords: [
    "coinfast",
    "solana",
    "token creation",
    "cryptocurrency",
    "memefast",
    "memefast.fun",
    "meme coins",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <PlausibleProvider domain="memefast.fun" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
