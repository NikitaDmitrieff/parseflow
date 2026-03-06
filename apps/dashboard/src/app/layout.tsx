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

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://parseflow-dashboard.vercel.app/#website",
      url: "https://parseflow-dashboard.vercel.app",
      name: "ParseFlow",
      description:
        "Invoice and document parser API. Upload a PDF or image, get back structured JSON.",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://parseflow-dashboard.vercel.app/?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://parseflow-dashboard.vercel.app/#app",
      name: "ParseFlow",
      url: "https://parseflow-dashboard.vercel.app",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any",
      description:
        "ParseFlow is a document parsing API that extracts structured JSON from invoices, receipts, and PDFs. Send a document, get back vendor name, invoice number, dates, totals, and line items.",
      offers: [
        {
          "@type": "Offer",
          name: "Free Tier",
          price: "0",
          priceCurrency: "USD",
          description: "50 document parses per month, no credit card required",
        },
        {
          "@type": "Offer",
          name: "Pro",
          price: "9",
          priceCurrency: "USD",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            billingDuration: "P1M",
          },
          description: "1,000 parses/month",
        },
        {
          "@type": "Offer",
          name: "Scale",
          price: "29",
          priceCurrency: "USD",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            billingDuration: "P1M",
          },
          description: "10,000 parses/month",
        },
      ],
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        ratingCount: "12",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
