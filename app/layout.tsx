import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BRD Tracker | Product Feature Requests",
  description: "Internal product tracking for features and BRDs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} flex min-h-screen bg-slate-100 font-sans antialiased`}>
        <svg className="absolute h-0 w-0" aria-hidden>
          <defs>
            <filter id="goo" colorInterpolationFilters="sRGB">
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
                result="goo"
              />
              <feComposite in="SourceGraphic" in2="goo" operator="atop" />
            </filter>
          </defs>
        </svg>
        <Sidebar />
        <main className="ml-16 min-w-0 flex-1 p-6">
          <div className="app-container">{children}</div>
        </main>
      </body>
    </html>
  );
}
