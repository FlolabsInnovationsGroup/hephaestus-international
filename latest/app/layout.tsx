import type { Metadata } from "next";
import { Geist, Marcellus } from "next/font/google";
import Script from "next/script";
import { PreferredSourcePrompt } from "@/components/preferred-source/preferred-source-prompt";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { buildMetadata } from "@/lib/metadata";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const marcellus = Marcellus({
  variable: "--font-marcellus",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = buildMetadata({});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${marcellus.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen antialiased">
        <Script
          src="https://news.google.com/swg/js/v1/publisher.js"
          strategy="afterInteractive"
        />
        <ThemeProvider>
          {children}
          <PreferredSourcePrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}
