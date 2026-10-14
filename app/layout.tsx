import type { Metadata } from "next";
import { DM_Sans, Newsreader } from "next/font/google";
import { Analytics } from "@/components/site/Analytics";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

// Display serif: the mockup's headline face is closest to Newsreader (CLAUDE.md §2).
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
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
    >
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
