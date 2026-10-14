import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { SectionRenderer } from "@/components/sections/SectionRenderer";
import { getPage } from "@/lib/data/pages";

const SITE_NAME = "Tangie Brickhouse-Beaty";

function slugKey(slug?: string[]) {
  return (slug ?? []).join("/");
}

export async function generateMetadata({
  params,
}: PageProps<"/[[...slug]]">): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  const page = await getPage(slugKey(slug)).catch(() => null);
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
  };
}

// Pages are read from the database when requested (the build server cannot reach it) and then
// cached. The slug is awaited inside Suspense, as Cache Components requires.
async function PageSections({
  params,
}: {
  params: PageProps<"/[[...slug]]">["params"];
}) {
  await connection();
  const { slug } = await params;
  let page;
  try {
    page = await getPage(slugKey(slug));
  } catch (e) {
    console.error("Could not load page from the database:", e);
    return (
      <div className="mx-auto max-w-[640px] px-6 py-32 text-center">
        <h1 className="font-display text-h2 text-heading">
          We&apos;re getting things ready
        </h1>
        <p className="mt-4 text-body text-copy">
          This page isn&apos;t available just yet. Please try again in a minute.
        </p>
      </div>
    );
  }
  if (!page) notFound();
  return <SectionRenderer sections={page.sections} />;
}

export default function Page({ params }: PageProps<"/[[...slug]]">) {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" aria-hidden />}>
      <PageSections params={params} />
    </Suspense>
  );
}
