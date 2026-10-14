import type { NextConfig } from "next";

// Old Wix blog addresses (/post/<wix-slug>) map to the new journal addresses (CLAUDE.md §4).
const LEGACY_POSTS: Array<[string, string]> = [
  [
    "blog-3-praise-god-for-closed-doors-your-only-way-is-forward",
    "praise-god-for-closed-doors",
  ],
  [
    "blog-2-the-real-battle-aligning-what-you-see-with-what-you-do",
    "the-real-battle",
  ],
  [
    "blog-1-your-time-your-truth-why-you-must-guard-your-divine-assignment",
    "your-time-your-truth",
  ],
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Page titles, descriptions, canonical and share tags go in <head> for every visitor, so no
  // crawler (Google, Bing, social sites, AI assistants) has to run JavaScript to see them.
  htmlLimitedBots: /.*/,
  partialPrefetching: true,
  images: {
    // All photos are served by this app from /media/ (they live in a private bucket).
    localPatterns: [{ pathname: "/media/**" }],
  },
  async redirects() {
    return [
      { source: "/upcoming-events", destination: "/events", statusCode: 301 },
      { source: "/blog", destination: "/journal", statusCode: 301 },
      ...LEGACY_POSTS.map(([from, to]) => ({
        source: `/post/${from}`,
        destination: `/journal/${to}`,
        statusCode: 301 as const,
      })),
      // Any other old blog post goes to the journal index.
      { source: "/post/:slug", destination: "/journal", statusCode: 301 },
      { source: "/book-tangie", destination: "/contact", statusCode: 301 },
      { source: "/product-page-1", destination: "/books", statusCode: 301 },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
