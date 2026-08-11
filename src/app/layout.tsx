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
  title: "Hypertron — B2B operations & payments on Stellar",
  description:
    "Create onboarding flows, collect payments, automate approvals, and settle funds privately across global teams.",
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
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
