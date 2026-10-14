import { Suspense } from "react";
import { connection } from "next/server";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getSiteChrome } from "@/lib/data/pages";
import { DEFAULT_CHROME } from "@/lib/site-data";

export const ensureStatic = "shell";

// The header and footer come from the database. `connection()` keeps that lookup at request
// time (the build server cannot reach the database), and the fallback is the same layout with
// the default links, so the static shell is never empty.
async function SiteHeader() {
  await connection();
  const chrome = await getSiteChrome();
  return <Header items={chrome.headerNav} cta={chrome.headerCta} />;
}

async function SiteFooter() {
  await connection();
  const chrome = await getSiteChrome();
  return (
    <Footer
      nav={chrome.footerNav}
      social={chrome.social}
      affiliates={chrome.affiliates}
    />
  );
}

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-bronze focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <Suspense
        fallback={
          <Header
            items={DEFAULT_CHROME.headerNav}
            cta={DEFAULT_CHROME.headerCta}
          />
        }
      >
        <SiteHeader />
      </Suspense>
      <main id="main">{children}</main>
      <Suspense
        fallback={
          <Footer
            nav={DEFAULT_CHROME.footerNav}
            social={DEFAULT_CHROME.social}
            affiliates={DEFAULT_CHROME.affiliates}
          />
        }
      >
        <SiteFooter />
      </Suspense>
    </>
  );
}
