import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ParseFlow — AI Document Parser API",
  description:
    "AI-powered invoice and document parsing API. Extract structured data from PDFs and images in seconds. Simple pricing. No minimums.",
  openGraph: {
    title: "ParseFlow — AI Document Parser API",
    description:
      "Extract structured data from invoices and documents via a simple API call.",
    type: "website",
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
