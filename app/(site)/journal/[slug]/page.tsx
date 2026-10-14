import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { JsonLd } from "@/components/site/JsonLd";
import { PageUnavailable } from "@/components/site/PageUnavailable";
import { PostArticle } from "@/components/site/PostArticle";
import { SectionRenderer } from "@/components/sections/SectionRenderer";
import { getPostDetail, getRelatedPosts } from "@/lib/data/posts";
import { getTemplateSections } from "@/lib/data/template-stack";
import { getSiteUrl } from "@/lib/site-url";

export async function generateMetadata({
  params,
}: PageProps<"/journal/[slug]">): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  const post = await getPostDetail(slug).catch(() => null);
  if (!post) return {};
  return {
    title: post.seoTitle ?? `${post.title} | Tangie Brickhouse-Beaty`,
    description: post.seoDescription ?? undefined,
    alternates: { canonical: `/journal/${post.slug}` },
    openGraph: {
      type: "article",
      publishedTime: post.publishedAtIso,
      images: post.cover ? [post.cover.src] : undefined,
    },
  };
}

async function PostContent({
  params,
  searchParams,
}: Pick<PageProps<"/journal/[slug]">, "params" | "searchParams">) {
  await connection();
  const { slug } = await params;
  let post;
  try {
    post = await getPostDetail(slug);
  } catch (e) {
    console.error("Could not load post:", e);
    return <PageUnavailable />;
  }
  if (!post) notFound();
  const [related, below] = await Promise.all([
    getRelatedPosts(post.slug, post.category),
    getTemplateSections("post"),
  ]);
  const site = getSiteUrl();
  const url = `${site}/journal/${post.slug}`;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          datePublished: post.publishedAtIso,
          author: { "@type": "Person", name: post.authorName },
          image: post.cover ? [`${site}${post.cover.src}`] : undefined,
          description: post.seoDescription ?? undefined,
          mainEntityOfPage: url,
        }}
      />
      <PostArticle post={post} url={url} related={related} />
      <SectionRenderer
        sections={below}
        context={{
          pathname: `/journal/${post.slug}`,
          searchParams: await searchParams,
        }}
      />
    </>
  );
}

export default function Page({
  params,
  searchParams,
}: PageProps<"/journal/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" aria-hidden />}>
      <PostContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
