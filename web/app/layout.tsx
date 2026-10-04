import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Onest, Unbounded } from "next/font/google";
import "./globals.css";

const display = Unbounded({ variable: "--font-display", subsets: ["latin", "cyrillic"], weight: ["500", "700", "900"] });
const body = Onest({ variable: "--font-body", subsets: ["latin", "cyrillic"] });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "American Space — меню",
  description: "Меню, заказ со стола и бонусы American Space",
  robots: { index: false },
};

export const viewport: Viewport = { themeColor: "#0E1A3A", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
