import { Suspense, ViewTransition } from "react";
import { connection } from "next/server";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { MotionController } from "@/components/site/MotionController";
import { getSiteChrome } from "@/lib/data/pages";
import { DEFAULT_CHROME } from "@/lib/site-data";
import { DEFAULT_THEME, themeCss } from "@/lib/theme";

export const ensureStatic = "shell";

// The header and footer come from the database. `connection()` keeps that lookup at request
// time (the build server cannot reach the database), and the fallback is the same layout with
// the default links, so the static shell is never empty.
async function loadChrome() {
  await connection();
  try {
    const chrome = await getSiteChrome();
    return chrome.headerNav.length > 0 ? chrome : DEFAULT_CHROME;
  } catch (e) {
    // If the database is unavailable the site still shows its header and footer.
    console.error("Could not load header/footer from the database:", e);
    return DEFAULT_CHROME;
  }
}

async function SiteHeader() {
  const chrome = await loadChrome();
  const a = chrome.announcement;
  return (
    <>
      {chrome.theme === DEFAULT_THEME ? null : (
        // The colour theme chosen in Site Settings (the default needs no override).
        <style>{themeCss(chrome.theme)}</style>
      )}
      {a ? (
        <div className="bg-ink px-4 py-2 text-center text-[13px] text-ivory">
          {a.link ? (
            <a href={a.link} className="underline underline-offset-2">
              {a.text}
            </a>
          ) : (
            a.text
          )}
        </div>
      ) : null}
      <Header items={chrome.headerNav} cta={chrome.headerCta} />
    </>
  );
}

// Scroll animation settings (on/off and Gentle/Bold) come from Site Settings.
async function SiteMotion() {
  const chrome = await loadChrome();
  return (
    <>
      {chrome.motion.enabled ? null : (
        <style>{`.motion [data-motion]{opacity:1!important;scale:none!important;animation:none!important}`}</style>
      )}
      <MotionController
        enabled={chrome.motion.enabled}
        level={chrome.motion.level}
      />
    </>
  );
}

async function SiteFooter() {
  const chrome = await loadChrome();
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
    <div className="flex min-h-screen flex-col">
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
      <ViewTransition>
        <main id="main" className="flex-1">
          {children}
        </main>
      </ViewTransition>
      <Suspense fallback={<MotionController />}>
        <SiteMotion />
      </Suspense>
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
    </div>
  );
}
