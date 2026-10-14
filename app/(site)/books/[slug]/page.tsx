import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { BookDetailView } from "@/components/site/BookDetailView";
import { JsonLd } from "@/components/site/JsonLd";
import { PageUnavailable } from "@/components/site/PageUnavailable";
import { SectionRenderer } from "@/components/sections/SectionRenderer";
import { getBookDetail } from "@/lib/data/books";
import { getTemplateSections } from "@/lib/data/template-stack";
import { htmlToText } from "@/lib/html";
import { getSiteUrl } from "@/lib/site-url";

export async function generateMetadata({
  params,
}: PageProps<"/books/[slug]">): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  const book = await getBookDetail(slug).catch(() => null);
  if (!book) return {};
  return {
    title: `${book.title} | Tangie Brickhouse-Beaty`,
    description: book.shortBlurb?.replace(/\*/g, "") ?? undefined,
    alternates: { canonical: `/books/${book.slug}` },
    openGraph: {
      images: book.cover ? [book.cover.src] : undefined,
      type: "book",
    },
  };
}

async function BookContent({
  params,
  searchParams,
}: Pick<PageProps<"/books/[slug]">, "params" | "searchParams">) {
  await connection();
  const { slug } = await params;
  let book;
  try {
    book = await getBookDetail(slug);
  } catch (e) {
    console.error("Could not load book:", e);
    return <PageUnavailable />;
  }
  if (!book) notFound();
  const below = await getTemplateSections("book");
  const site = getSiteUrl();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Book",
          name: book.title,
          author: { "@type": "Person", name: "Tangie Brickhouse-Beaty" },
          description: book.synopsisHtml
            ? htmlToText(book.synopsisHtml).slice(0, 500)
            : undefined,
          image: book.cover ? `${site}${book.cover.src}` : undefined,
          url: `${site}/books/${book.slug}`,
        }}
      />
      <BookDetailView book={book} />
      <SectionRenderer
        sections={below}
        context={{
          pathname: `/books/${book.slug}`,
          searchParams: await searchParams,
        }}
      />
    </>
  );
}

export default function Page({
  params,
  searchParams,
}: PageProps<"/books/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" aria-hidden />}>
      <BookContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
