import Link from "next/link";
import type { PostsPage } from "@/lib/data/posts";
import type { Background, Spacing } from "@/lib/sections/types";
import { PostCard } from "@/components/ui/PostCard";
import { SectionShell } from "./SectionShell";

export type PostGridProps = {
  data: PostsPage;
  categories: string[];
  activeCategory?: string;
  basePath: string;
  background?: Background;
  spacing?: Spacing;
};

function href(base: string, category?: string, page?: number) {
  const q = new URLSearchParams();
  if (category) q.set("category", category);
  if (page && page > 1) q.set("page", String(page));
  const s = q.toString();
  return s ? `${base}?${s}` : base;
}

export function PostGrid({
  data,
  categories,
  activeCategory,
  basePath,
  background,
  spacing,
}: PostGridProps) {
  const pages = Math.max(1, Math.ceil(data.total / data.perPage));
  const chip =
    "inline-flex min-h-11 items-center border px-4 text-eyebrow font-semibold uppercase tracking-[0.14em] transition-colors duration-200";
  return (
    <SectionShell background={background} spacing={spacing}>
      {categories.length > 0 ? (
        <nav
          aria-label="Journal categories"
          className="mb-10 flex flex-wrap gap-2 lg:mb-[calc(var(--u)*56)]"
        >
          <Link
            href={href(basePath)}
            aria-current={!activeCategory ? "page" : undefined}
            className={`${chip} ${!activeCategory ? "border-bronze bg-bronze text-white" : "border-bronze-light text-bronze hover:border-bronze"}`}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c}
              href={href(basePath, c)}
              aria-current={activeCategory === c ? "page" : undefined}
              className={`${chip} ${activeCategory === c ? "border-bronze bg-bronze text-white" : "border-bronze-light text-bronze hover:border-bronze"}`}
            >
              {c}
            </Link>
          ))}
        </nav>
      ) : null}

      {data.posts.length > 0 ? (
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-[calc(var(--u)*32)] lg:gap-y-[calc(var(--u)*56)]">
          {data.posts.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>
      ) : (
        <p className="text-body text-copy">
          No posts here yet. Check back soon.
        </p>
      )}

      {pages > 1 ? (
        <nav
          aria-label="Pagination"
          className="mt-14 flex items-center justify-between gap-4 lg:mt-[calc(var(--u)*72)]"
        >
          {data.page > 1 ? (
            <Link
              href={href(basePath, activeCategory, data.page - 1)}
              rel="prev"
              className="text-link font-semibold uppercase tracking-[0.16em] text-bronze"
            >
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-small text-stone">
            Page {data.page} of {pages}
          </span>
          {data.page < pages ? (
            <Link
              href={href(basePath, activeCategory, data.page + 1)}
              rel="next"
              className="text-link font-semibold uppercase tracking-[0.16em] text-bronze"
            >
              Older →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </SectionShell>
  );
}
