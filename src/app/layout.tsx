import type { Metadata } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Hypertron: Privacy infrastructure for Payments",
  description:
    "A shielded pool on Stellar for private payments: protocol, API, and workspace on one settlement rail.",
  icons: {
    icon: [
      {
        url: "/media/logo_black.png",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/media/logo_white.png",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: "/media/logo_black.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full antialiased font-sans",
        inter.variable,
        instrument.variable,
      )}
    >
      <body
        className="flex min-h-full flex-col font-sans"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
