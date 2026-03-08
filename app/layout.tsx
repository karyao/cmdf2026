import type { Metadata, Viewport } from "next";
import { Caveat, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans" });
const hand = Caveat({ subsets: ["latin"], variable: "--font-hand", weight: ["500", "700"] });

export const metadata: Metadata = {
  title: "Day in the Life",
  description: "Scrapbook-inspired hourly social timeline"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${hand.variable} antialiased`}>{children}</body>
    </html>
  );
}
