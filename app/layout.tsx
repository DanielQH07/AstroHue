import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const sans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://astrohue.vercel.app"),
  title: {
    default: "AstroHue — Find a color hidden in the cosmos",
    template: "%s · AstroHue",
  },
  description:
    "A free astronomy color guessing game. Explore a full-color image and follow HSL clues to find one sampled color.",
  applicationName: "AstroHue",
  openGraph: {
    title: "AstroHue",
    description: "Find a color hidden in the cosmos.",
    type: "website",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "AstroHue",
    description: "Find a color hidden in the cosmos.",
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  themeColor: "#F3F0E8",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable}`}>{children}</body>
    </html>
  );
}
