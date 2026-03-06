import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://parseflow-dashboard.vercel.app";
  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/upgrade`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];
}
