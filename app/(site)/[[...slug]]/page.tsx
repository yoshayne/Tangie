import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { PageUnavailable } from "@/components/site/PageUnavailable";
import { SectionRenderer } from "@/components/sections/SectionRenderer";
import { JsonLd } from "@/components/site/JsonLd";
import { getPage, getSiteChrome } from "@/lib/data/pages";
import { getDefaultShareImage } from "@/lib/data/seo";
import {
  DEFAULT_DESCRIPTION,
  SITE_NAME,
  describeSections,
  pageMetadata,
} from "@/lib/seo";
import { getSiteUrl } from "@/lib/site-url";

function slugKey(slug?: string[]) {
  return (slug ?? []).join("/");
}

// Template stacks (`_template/...`) are editable in the admin but are not public pages.
const isTemplate = (key: string) => key.startsWith("_template");

export async function generateMetadata({
  params,
}: PageProps<"/[[...slug]]">): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  const key = slugKey(slug);
  if (isTemplate(key)) return {};
  const page = await getPage(key).catch(() => null);
  if (!page) return {};
  const isHome = page.slug === "";
  const fallback = page.ogMedia
    ? null
    : await getDefaultShareImage().catch(() => null);
  return pageMetadata({
    title: isHome
      ? (page.seoTitle ??
        `${SITE_NAME} | Author, Playwright, Director, Producer`)
      : (page.seoTitle ?? page.title),
    // A title written in Page settings is used exactly as written.
    absoluteTitle: isHome || Boolean(page.seoTitle),
    description:
      page.seoDescription ??
      describeSections(page.sections.map((s) => ({ ...s, hidden: s.hidden }))),
    path: key ? `/${key}` : "/",
    image: page.ogMedia
      ? {
          mediaId: page.ogMedia.id,
          version: page.ogMedia.version,
          alt: page.ogMedia.alt,
        }
      : fallback,
    // The thank-you page after confirming the mailing list is not for search results.
    noindex: key === "newsletter-confirmed",
  });
}

// Pages are read from the database when requested (the build server cannot reach it) and then
// cached. The slug is awaited inside Suspense, as Cache Components requires.
async function PageSections({
  params,
  searchParams,
}: Pick<PageProps<"/[[...slug]]">, "params" | "searchParams">) {
  await connection();
  const { slug } = await params;
  const key = slugKey(slug);
  if (isTemplate(key)) notFound();

  let page;
  try {
    page = await getPage(key);
  } catch (e) {
    console.error("Could not load page from the database:", e);
    return <PageUnavailable />;
  }
  if (!page) notFound();

  const site = getSiteUrl();
  const chrome = await getSiteChrome().catch(() => null);
  const sameAs = (chrome?.social ?? []).flatMap((x) =>
    x.href ? [x.href] : [],
  );
  const hero = page.sections.find((x) => !x.hidden && x.type === "hero_split");
  const heroImage = (hero?.props.image as { src?: string } | undefined)?.src;
  const person = {
    "@type": "Person",
    "@id": `${site}/#tangie`,
    name: SITE_NAME,
    url: site,
    jobTitle: ["Author", "Playwright", "Director", "Producer"],
    description: DEFAULT_DESCRIPTION,
    ...(heroImage ? { image: `${site}${heroImage}` } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
  const isHome = page.slug === "";
  const jsonLd =
    isHome || page.slug === "about"
      ? {
          "@context": "https://schema.org",
          "@graph": [
            person,
            ...(isHome
              ? [
                  {
                    "@type": "WebSite",
                    "@id": `${site}/#website`,
                    url: site,
                    name: SITE_NAME,
                    publisher: { "@id": `${site}/#tangie` },
                  },
                ]
              : []),
          ],
        }
      : {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: site },
            {
              "@type": "ListItem",
              position: 2,
              name: page.title,
              item: `${site}/${key}`,
            },
          ],
        };

  return (
    <>
      <JsonLd data={jsonLd} />
      <SectionRenderer
        sections={page.sections}
        context={{
          pathname: key ? `/${key}` : "/",
          searchParams: await searchParams,
        }}
      />
    </>
  );
}

export default function Page({
  params,
  searchParams,
}: PageProps<"/[[...slug]]">) {
  return (
    <Suspense fallback={<div className="min-h-[100svh]" aria-hidden />}>
      <PageSections params={params} searchParams={searchParams} />
    </Suspense>
  );
}
