import { ArrowLink } from "@/components/ui/ArrowLink";
import { PostCard, type PostCardData } from "@/components/ui/PostCard";
import { SectionHeading } from "@/components/ui/SectionHeading";

export type PostCardsProps = {
  eyebrow: string;
  heading: string;
  linkLabel: string;
  linkHref: string;
  posts: PostCardData[];
};

export function PostCards({
  eyebrow,
  heading,
  linkLabel,
  linkHref,
  posts,
}: PostCardsProps) {
  return (
    <section className="bg-ivory-soft px-4 pb-14 pt-4 md:px-6 lg:px-0 lg:pb-[calc(var(--u)*26)] lg:pt-0">
      <div className="mx-auto max-w-[1440px] lg:pl-[calc(var(--u)*91)] lg:pr-[calc(var(--u)*73)]">
        <div className="flex items-start justify-between gap-4">
          <SectionHeading eyebrow={eyebrow} heading={heading} />
          <div className="hidden sm:block lg:mt-[calc(var(--u)*34)]">
            <ArrowLink href={linkHref}>{linkLabel}</ArrowLink>
          </div>
        </div>
        <div className="mt-6 grid gap-8 md:grid-cols-3 md:gap-5 lg:mt-0 lg:gap-[calc(var(--u)*32)]">
          {posts.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>
        <div className="mt-8 sm:hidden">
          <ArrowLink href={linkHref}>{linkLabel}</ArrowLink>
        </div>
      </div>
    </section>
  );
}
