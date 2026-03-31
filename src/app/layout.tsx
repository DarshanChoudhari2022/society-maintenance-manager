import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Optimized font loading 
import "./globals.css";
import ToastProvider from "@/components/ui/Toast";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Society Maintenance Manager — Smart & Transparent Maintenance Collection",
  description:
    "Digital maintenance collection system for housing societies. Track payments, send reminders, generate receipts. By Buzyhub.in",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1", // Prevents iOS zoom input lag
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
