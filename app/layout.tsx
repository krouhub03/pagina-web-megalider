import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { WebVitals } from "@/components/analytics/web-vitals";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Cigarrería Megalider | Tu cigarrería de confianza en Engativá",
  description:
    "Descubre nuestra selección premium de licores, snacks y productos de necesidad en Engativá, Bogotá. Calidad, rapidez y confianza.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${playfair.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col font-sans bg-[#fafbf9] text-[#1e2e28] selection:bg-[#2ea587]/20 selection:text-[#0b4d3c]"
      >
        <WebVitals />
        {children}
      </body>
    </html>
  );
}
