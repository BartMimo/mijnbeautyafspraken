import "./globals.css";
import { Dancing_Script } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";

const brandFont = Dancing_Script({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-brand",
});

export const metadata = {
  title: "Mijnbeautyafspraken",
  description: "Plan al je beauty-afspraken op één plek.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className={`antialiased ${brandFont.variable}`}>
        <SiteHeader />
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}