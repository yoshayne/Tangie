import type { Metadata } from "next";
import { Suspense } from "react";
import { DM_Sans } from "next/font/google";
import localFont from "next/font/local";
import { Analytics } from "@/components/site/Analytics";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

// Display serif: the mockup's headline face is closest to Newsreader (CLAUDE.md §2). Self-hosted and
// trimmed to the weights and characters the site uses (see app/fonts/README.md).
const newsreader = localFont({
  src: [
    {
      path: "./fonts/newsreader-normal.woff2",
      style: "normal",
      weight: "400 600",
    },
    {
      path: "./fonts/newsreader-italic.woff2",
      style: "italic",
      weight: "400 600",
    },
  ],
  variable: "--font-newsreader",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "Tangie Brickhouse-Beaty",
  description:
    "Author, playwright, director, and producer whose work spans books, stage, and screen.",
  robots:
    process.env.NEXT_PUBLIC_SITE_URL === "https://www.tangiebeaty.com"
      ? undefined
      : { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${newsreader.variable} ${dmSans.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Turns on scroll animations before the first paint, unless the visitor prefers less motion. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{if(!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("motion")}catch(e){}',
          }}
        />
      </head>
      <body>
        {children}
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
      </body>
    </html>
  );
}
