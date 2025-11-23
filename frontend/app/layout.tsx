import type { Metadata } from "next";
import { Roboto, Poppins } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Script from "next/script";

const roboto = Roboto({ 
  weight: ['300', '400', '500', '700'],
  subsets: ["latin"],
  variable: '--font-roboto'
});

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ["latin"],
  variable: '--font-poppins'
});

export const metadata: Metadata = {
  title: "Hephaestus.International | Innovation in AI & Robotics",
  description: "Join Hephaestus.International - Building the future through innovation in AI, robotics, and cutting-edge technology. Explore internship opportunities.",
  keywords: "AI, robotics, internships, technology, machine learning, engineering",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${roboto.variable} ${poppins.variable} font-sans`}>
        {/* Skip to content link for accessibility - matching WordPress */}
        <a 
          href="#content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#00349B] focus:text-white focus:rounded-md focus:shadow-lg"
        >
          Skip to content
        </a>
        <Header />
        <main id="content" className="min-h-screen">
          {children}
        </main>
        <Footer />
        {/* HubSpot Forms Script */}
        <Script
          src="//js.hsforms.net/forms/embed/v2.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
