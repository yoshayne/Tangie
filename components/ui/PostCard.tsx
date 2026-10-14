import Image from "next/image";
import Link from "next/link";
import { ArrowLink } from "./ArrowLink";
import { QuillIcon } from "./QuillIcon";
import {
  blurProps,
  focalToPosition,
  type ImageRef,
} from "@/lib/sections/types";

export type PostCardData = {
  slug: string;
  title: string;
  /** Display date, e.g. "December 14, 2025" */
  date: string;
  image?: ImageRef;
};

export function PostCard({ post }: { post: PostCardData }) {
  const href = `/journal/${post.slug}`;
  return (
    <article>
      <Link href={href} className="block">
        <div className="relative aspect-video w-full overflow-hidden bg-sand lg:aspect-[403/165]">
          {post.image ? (
            <Image
              src={post.image.src}
              {...blurProps(post.image)}
              alt={post.image.alt}
              fill
              sizes="(min-width: 1024px) 30vw, (min-width: 768px) 33vw, 100vw"
              className="object-cover"
              style={{ objectPosition: focalToPosition(post.image.focal) }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-ivory-deep">
              <QuillIcon className="h-14 w-14 text-bronze-light/70" />
            </div>
          )}
        </div>
      </Link>
      <h3 className="mt-4 line-clamp-2 font-display text-card-title font-medium text-[#222] lg:mt-[calc(var(--u)*18)]">
        <Link href={href}>{post.title}</Link>
      </h3>
      <p className="mt-1 text-small text-stone lg:mt-[calc(var(--u)*10)]">
        {post.date}
      </p>
      <ArrowLink href={href} className="mt-3 lg:mt-[calc(var(--u)*14)]">
        Read more
      </ArrowLink>
    </article>
  );
}
