import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getSitemapEntries } from "@/lib/data/seo";
import { getSiteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Read from the database when asked (the build server cannot reach it).
  await connection();
  const site = getSiteUrl();
  try {
    const entries = await getSitemapEntries();
    return entries.map((e) => ({
      url: `${site}${e.path === "/" ? "" : e.path}`,
      lastModified: e.lastModified,
      changeFrequency:
        e.path === "/" || e.path === "/events" || e.path === "/journal"
          ? "weekly"
          : "monthly",
      priority: e.path === "/" ? 1 : e.path.split("/").length > 2 ? 0.6 : 0.8,
    }));
  } catch (e) {
    console.error("Could not build the sitemap:", e);
    return [{ url: site, changeFrequency: "weekly", priority: 1 }];
  }
}
