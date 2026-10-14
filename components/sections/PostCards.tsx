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
        <div className="-mx-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 md:pb-0 lg:mt-0 lg:gap-[calc(var(--u)*32)] [&::-webkit-scrollbar]:hidden">
          {posts.map((p) => (
            <div key={p.slug} className="w-[84%] shrink-0 snap-start md:w-auto">
              <PostCard post={p} />
            </div>
          ))}
        </div>
        <div className="mt-8 sm:hidden">
          <ArrowLink href={linkHref}>{linkLabel}</ArrowLink>
        </div>
      </div>
    </section>
  );
}
