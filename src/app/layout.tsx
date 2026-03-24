import type { Metadata } from "next";
import "./globals.css";
import ToastProvider from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "Society Maintenance Manager — Smart & Transparent Maintenance Collection",
  description:
    "Digital maintenance collection system for housing societies. Track payments, send reminders, generate receipts. By Buzyhub.in",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
