import type { ReactNode } from "react";
import { z } from "zod";
import { DarkFeature } from "@/components/sections/DarkFeature";
import { EventCards } from "@/components/sections/EventCards";
import { FeatureBook } from "@/components/sections/FeatureBook";
import { HeroSplit } from "@/components/sections/HeroSplit";
import { ImageText } from "@/components/sections/ImageText";
import { Newsletter } from "@/components/sections/Newsletter";
import { PostCards } from "@/components/sections/PostCards";
import { getBookBySlug } from "@/lib/data/books";
import { getUpcomingEvents } from "@/lib/data/events";
import { getLatestPosts } from "@/lib/data/posts";

/**
 * The section registry: one entry per section type. The page renderer, the (later) page
 * builder's picker and its auto-generated forms all read from here, so adding a section
 * type means adding one component and one entry.
 */

const image = z.object({
  mediaId: z.string().optional(),
  src: z.string().min(1),
  alt: z.string(),
  width: z.number(),
  height: z.number(),
  focal: z.tuple([z.number(), z.number()]).optional(),
  blur: z.string().optional(),
});

const button = z.object({
  label: z.string().min(1).max(40),
  href: z.string().min(1),
  variant: z.enum(["filled", "outline"]).default("filled"),
  newTab: z.boolean().optional(),
});
const buttons = z.array(button).max(2);

const heroSplit = z.object({
  titleLine1: z.string().min(1).max(40),
  titleLine2: z.string().max(40).default(""),
  roleLine: z.string().max(120).default(""),
  body: z.string().max(400),
  buttons: buttons.default([]),
  image,
  imageSide: z.enum(["left", "right"]).default("right"),
});

const featureBook = z.object({
  eyebrow: z.string().max(40),
  /** Pick a book here and its title, blurb and links fill in automatically unless overridden. */
  bookSlug: z.string().optional(),
  heading: z.string().max(60).optional(),
  headingItalic: z.boolean().default(true),
  body: z.string().max(500).optional(),
  buttons: buttons.optional(),
  image,
  imageFit: z.enum(["cover", "contain"]).default("cover"),
  imageSide: z.enum(["left", "right"]).default("left"),
});

const imageText = z.object({
  eyebrow: z.string().max(40),
  heading: z.string().max(80),
  body: z.string().max(600),
  buttons: buttons.default([]),
  image,
  imageSide: z.enum(["left", "right"]).default("left"),
  imageStyle: z.enum(["framed", "bleed"]).default("framed"),
});

const darkFeature = z.object({
  eyebrow: z.string().max(40),
  heading: z.string().max(60),
  body: z.string().max(600),
  buttons: buttons.default([]),
  image: image.optional(),
});

const eventCards = z.object({
  eyebrow: z.string().max(40),
  heading: z.string().max(60),
  linkLabel: z.string().max(40),
  linkHref: z.string(),
  count: z.number().int().min(1).max(6).default(3),
  layout: z.enum(["grid", "list"]).default("grid"),
  emptyText: z.string().max(200),
  emptyLinkLabel: z.string().max(60),
  emptyLinkHref: z.string(),
});

const postCards = z.object({
  eyebrow: z.string().max(40),
  heading: z.string().max(60),
  linkLabel: z.string().max(40),
  linkHref: z.string(),
  count: z.union([z.literal(3), z.literal(6), z.literal(9)]).default(3),
  category: z.string().optional(),
});

const newsletter = z.object({
  eyebrow: z.string().max(40),
  heading: z.string().max(60),
  body: z.string().max(200),
  buttonLabel: z.string().max(30).default("Subscribe"),
  successMessage: z.string().max(120).default("Check your inbox to confirm."),
  image: image.optional(),
});

type SectionDef<S extends z.ZodType, E = undefined> = {
  label: string;
  description: string;
  schema: S;
  /** Loads any database content the section shows. */
  load?: (props: z.output<S>) => Promise<E>;
  render: (props: z.output<S>, extra: E) => ReactNode;
};

function define<S extends z.ZodType, E = undefined>(def: SectionDef<S, E>) {
  return def;
}

export const registry = {
  hero_split: define({
    label: "Hero (split)",
    description: "Large name and intro on one side, portrait on the other.",
    schema: heroSplit,
    render: (p) => <HeroSplit {...p} />,
  }),

  feature_book: define({
    label: "Featured book",
    description: "Book photo beside its title, blurb and buy buttons.",
    schema: featureBook,
    load: async (p) => (p.bookSlug ? await getBookBySlug(p.bookSlug) : null),
    render: (p, book) => {
      const learnMore = book ? `/books/${book.slug}` : "/books";
      const fallbackButtons = [
        { label: "Learn More", href: learnMore, variant: "filled" as const },
        ...(book
          ? [
              {
                label: "Buy the Book",
                href: book.buyUrl ?? `${learnMore}#buy`,
                variant: "outline" as const,
                newTab: Boolean(book.buyUrl),
              },
            ]
          : []),
      ];
      return (
        <FeatureBook
          eyebrow={p.eyebrow}
          heading={p.heading ?? book?.title ?? ""}
          headingItalic={p.headingItalic}
          body={p.body ?? book?.shortBlurb ?? ""}
          buttons={p.buttons ?? fallbackButtons}
          image={p.image}
          imageFit={p.imageFit}
          imageSide={p.imageSide}
        />
      );
    },
  }),

  image_text: define({
    label: "Image and text",
    description: "A photo beside a heading, paragraph and buttons.",
    schema: imageText,
    render: (p) => <ImageText {...p} />,
  }),

  dark_feature: define({
    label: "Dark feature",
    description: "Dark band with text and a photo that fades into it.",
    schema: darkFeature,
    render: (p) => <DarkFeature {...p} />,
  }),

  event_cards: define({
    label: "Upcoming events",
    description: "The next events, or a friendly message when there are none.",
    schema: eventCards,
    load: (p) => getUpcomingEvents(p.count),
    render: (p, events) => (
      <EventCards
        eyebrow={p.eyebrow}
        heading={p.heading}
        linkLabel={p.linkLabel}
        linkHref={p.linkHref}
        events={events}
        emptyText={p.emptyText}
        emptyLinkLabel={p.emptyLinkLabel}
        emptyLinkHref={p.emptyLinkHref}
      />
    ),
  }),

  post_cards: define({
    label: "Latest journal posts",
    description: "The newest journal posts as cards.",
    schema: postCards,
    load: (p) => getLatestPosts(p.count, p.category),
    render: (p, posts) => (
      <PostCards
        eyebrow={p.eyebrow}
        heading={p.heading}
        linkLabel={p.linkLabel}
        linkHref={p.linkHref}
        posts={posts}
      />
    ),
  }),

  newsletter: define({
    label: "Newsletter signup",
    description: "Email signup band.",
    schema: newsletter,
    render: (p) => <Newsletter {...p} />,
  }),
};

export type SectionType = keyof typeof registry;

export function isSectionType(type: string): type is SectionType {
  return type in registry;
}
