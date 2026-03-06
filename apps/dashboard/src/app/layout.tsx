import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ParseFlow — Invoice & Document Parser API",
  description:
    "Parse invoices, receipts, and PDFs into structured JSON via a single API call. Free tier: 50 parses/month. No credit card required.",
  keywords: [
    "invoice parser API",
    "document parsing API",
    "PDF to JSON API",
    "invoice OCR API",
    "receipt parser",
    "document extraction API",
    "structured data extraction",
  ],
  openGraph: {
    title: "ParseFlow — Invoice & Document Parser API",
    description:
      "Upload a PDF or image, get back structured JSON. Vendor, amounts, dates, line items — extracted in one API call. Free tier available.",
    type: "website",
    url: "https://parseflow-dashboard.vercel.app",
    siteName: "ParseFlow",
    images: [
      {
        url: "https://parseflow-dashboard.vercel.app/api/og",
        width: 1200,
        height: 630,
        alt: "ParseFlow — Invoice & Document Parser API",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ParseFlow — Invoice & Document Parser API",
    description:
      "Upload a PDF or image, get back structured JSON. Free tier: 50 parses/month.",
    images: ["https://parseflow-dashboard.vercel.app/api/og"],
  },
  alternates: {
    canonical: "https://parseflow-dashboard.vercel.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
