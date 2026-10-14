import Image from "next/image";
import Link from "next/link";
import type { PostCardData } from "@/components/ui/PostCard";
import { PostCard } from "@/components/ui/PostCard";
import type { PostDetail } from "@/lib/data/posts";
import { sanitizeRich } from "@/lib/html";
import { blurProps, imageStyle } from "@/lib/sections/types";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ShareLinks } from "./ShareLinks";

export function PostArticle({
  post,
  url,
  related,
}: {
  post: PostDetail;
  url: string;
  related: PostCardData[];
}) {
  return (
    <>
      <article className="bg-ivory px-4 pb-16 pt-12 md:px-6 lg:px-[calc(var(--u)*120)] lg:pb-[calc(var(--u)*96)] lg:pt-[calc(var(--u)*88)]">
        <div className="mx-auto lg:max-w-[calc(var(--u)*960)]">
          {post.category ? (
            <Eyebrow>
              <Link
                href={`/journal?category=${encodeURIComponent(post.category)}`}
              >
                {post.category}
              </Link>
            </Eyebrow>
          ) : null}
          <h1 className="mt-4 font-display text-page-h1 font-normal text-heading">
            {post.title}
          </h1>
          <p className="mt-5 text-small text-stone">
            <time dateTime={post.publishedAtIso}>{post.dateLabel}</time> ·{" "}
            {post.readingMinutes} min read · By {post.authorName}
          </p>
        </div>
        {post.cover ? (
          <div className="mx-auto mt-10 lg:max-w-[calc(var(--u)*960)] lg:mt-[calc(var(--u)*48)]">
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-sand">
              <Image
                src={post.cover.src}
                alt={post.cover.alt}
                fill
                priority
                sizes="(min-width: 1024px) 76vw, 100vw"
                {...blurProps(post.cover)}
                className="object-cover"
                style={imageStyle(post.cover)}
              />
            </div>
          </div>
        ) : null}
        <div className="mx-auto mt-10 lg:max-w-[calc(var(--u)*960)] lg:mt-[calc(var(--u)*56)]">
          <div className="lg:max-w-[calc(var(--u)*760)]">
            <div
              className="prose prose-site"
              dangerouslySetInnerHTML={{ __html: sanitizeRich(post.bodyHtml) }}
            />
            <div className="mt-12 border-t border-bronze-light/60 pt-6">
              <ShareLinks url={url} title={post.title} />
            </div>
          </div>
        </div>
      </article>

      {related.length > 0 ? (
        <section className="bg-ivory-soft px-4 py-14 md:px-6 lg:px-[calc(var(--u)*120)] lg:py-[calc(var(--u)*80)]">
          <div className="mx-auto max-w-[1440px]">
            <Eyebrow>Keep reading</Eyebrow>
            <div className="mt-8 grid gap-10 md:grid-cols-3 lg:gap-[calc(var(--u)*32)]">
              {related.map((p) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
