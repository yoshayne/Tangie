import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getSiteUrl, isProductionSite } from "@/lib/site-url";

export default async function robots(): Promise<MetadataRoute.Robots> {
  await connection();
  const site = getSiteUrl();
  // Test addresses (Railway, local) must never be indexed.
  if (!isProductionSite()) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/preview/"],
    },
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
