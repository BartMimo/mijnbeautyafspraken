import "./globals.css";
import type { Metadata } from "next";
import { Dancing_Script } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";

/**
 * SITE METADATA
 * Deze wordt gebruikt voor:
 * - browser tab titel
 * - favicon
 * - SEO (Google)
 */
export const metadata: Metadata = {
  title: "Mijn Beauty Afspraken",
  description: "Boek eenvoudig beauty-afspraken bij salons bij jou in de buurt.",
  icons: {
    icon: "/lippenstift.png",
  },
};

/**
 * BRAND FONT
 */
const brandFont = Dancing_Script({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-brand",
});

/**
 * ROOT LAYOUT
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body className={`antialiased ${brandFont.variable}`}>
        <SiteHeader />
        <main className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}