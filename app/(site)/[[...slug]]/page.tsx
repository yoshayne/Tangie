import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { PageUnavailable } from "@/components/site/PageUnavailable";
import { SectionRenderer } from "@/components/sections/SectionRenderer";
import { getPage } from "@/lib/data/pages";

const SITE_NAME = "Tangie Brickhouse-Beaty";

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
  return {
    title: isHome
      ? {
          absolute:
            page.seoTitle ??
            `${SITE_NAME} | Author, Playwright, Director, Producer`,
        }
      : (page.seoTitle ?? `${page.title} | ${SITE_NAME}`),
    description: page.seoDescription ?? undefined,
    alternates: { canonical: key ? `/${key}` : "/" },
  };
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

  return (
    <SectionRenderer
      sections={page.sections}
      context={{
        pathname: key ? `/${key}` : "/",
        searchParams: await searchParams,
      }}
    />
  );
}

export default function Page({
  params,
  searchParams,
}: PageProps<"/[[...slug]]">) {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" aria-hidden />}>
      <PageSections params={params} searchParams={searchParams} />
    </Suspense>
  );
}
