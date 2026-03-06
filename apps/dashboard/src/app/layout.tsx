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
    {
      "@type": "FAQPage",
      "@id": "https://parseflow-dashboard.vercel.app/#faq",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is ParseFlow?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "ParseFlow is an AI-powered document parsing API that extracts structured JSON data from invoices, receipts, and PDFs. Send a document via a single API call and receive vendor details, invoice numbers, dates, totals, and line items.",
          },
        },
        {
          "@type": "Question",
          name: "What document types does ParseFlow support?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "ParseFlow supports PDF files and image formats (PNG, JPG, WEBP). It is optimized for invoices and receipts, and also handles contracts and general business documents.",
          },
        },
        {
          "@type": "Question",
          name: "How much does ParseFlow cost?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "ParseFlow offers a free tier with 50 parses per month — no credit card required. The Pro plan costs $0.02 per parse (no monthly minimum), and the Scale plan costs $29/month for 10,000 parses. Enterprise custom pricing is also available.",
          },
        },
        {
          "@type": "Question",
          name: "How do I get an API key?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Register at parseflow-dashboard.vercel.app/register to receive your free API key instantly. No credit card is required. You get 50 free parses per month on the Starter plan.",
          },
        },
        {
          "@type": "Question",
          name: "What data does ParseFlow extract from invoices?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "ParseFlow extracts vendor name, vendor address, invoice number, invoice date, due date, currency, subtotal, tax amount, total amount, and individual line items (description, quantity, unit price, amount). All data is returned as clean, structured JSON.",
          },
        },
        {
          "@type": "Question",
          name: "How accurate is ParseFlow?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "ParseFlow returns a confidence score (0-1) with every parse result. For standard invoices and receipts, accuracy is typically above 90%. Each response includes the confidence field so you can programmatically handle low-confidence results.",
          },
        },
        {
          "@type": "Question",
          name: "How long does parsing take?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Most documents are parsed in under 2 seconds. The API response includes a processing_ms field showing the exact processing time. ParseFlow is designed for production workloads with high throughput.",
          },
        },
        {
          "@type": "Question",
          name: "Does ParseFlow support webhooks?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Pro and Scale plan users can configure webhook delivery to receive parsed results via HTTP POST to any endpoint. This is useful for asynchronous processing pipelines and batch workflows.",
          },
        },
      ],
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
