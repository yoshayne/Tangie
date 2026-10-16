import type { ReactNode } from "react";
import { z } from "zod";
import { DarkFeature } from "@/components/sections/DarkFeature";
import { EventCards } from "@/components/sections/EventCards";
import { FeatureBook } from "@/components/sections/FeatureBook";
import { HeroSplit } from "@/components/sections/HeroSplit";
import { ImageText } from "@/components/sections/ImageText";
import { Newsletter } from "@/components/sections/Newsletter";
import { PostCards } from "@/components/sections/PostCards";
import { BookGrid } from "@/components/sections/BookGrid";
import {
  ContactForm,
  BookingForm,
  INQUIRY_TYPES,
} from "@/components/sections/InquirySections";
import { CreditsList } from "@/components/sections/CreditsList";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { Downloads } from "@/components/sections/Downloads";
import { Embed } from "@/components/sections/Embed";
import { EventList } from "@/components/sections/EventList";
import { Faq } from "@/components/sections/Faq";
import { ImageGallery } from "@/components/sections/ImageGallery";
import { ListFeature } from "@/components/sections/ListFeature";
import { LogoStrip } from "@/components/sections/LogoStrip";
import { PageHero } from "@/components/sections/PageHero";
import { PostGrid } from "@/components/sections/PostGrid";
import { Quote } from "@/components/sections/Quote";
import { RichText } from "@/components/sections/RichText";
import { SpacerDivider } from "@/components/sections/SpacerDivider";
import { StatsRow } from "@/components/sections/StatsRow";
import { Testimonials } from "@/components/sections/Testimonials";
import { TwoColumnText } from "@/components/sections/TwoColumnText";
import { Video } from "@/components/sections/Video";
import { getBookBySlug, getBooks } from "@/lib/data/books";
import { getCredits } from "@/lib/data/credits";
import { getEventList } from "@/lib/data/events";
import { getJournalCategories, getPostsPage } from "@/lib/data/posts";
import { getTestimonials } from "@/lib/data/testimonials";
import { isAllowedEmbed } from "@/lib/video";
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
  crop: z
    .object({
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
      zoom: z.number().min(1).max(4),
    })
    .optional(),
});

const button = z.object({
  label: z.string().min(1).max(40),
  href: z.string().min(1),
  variant: z.enum(["filled", "outline"]).default("filled"),
  newTab: z.boolean().optional(),
  track: z.string().max(40).optional(),
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

// ---------------------------------------------------------------------------
// Building blocks for new pages (M4)
// ---------------------------------------------------------------------------
const appearance = {
  background: z
    .enum(["ivory", "ivory-deep", "sand", "white", "ink"])
    .optional(),
  spacing: z.enum(["compact", "normal", "spacious"]).optional(),
};

const pageHero = z.object({
  eyebrow: z.string().max(40).optional(),
  heading: z.string().min(1).max(80),
  intro: z.string().max(500).optional(),
  image: image.optional(),
});

const richText = z.object({
  body: z.string().min(1),
  maxWidth: z.enum(["narrow", "wide"]).default("narrow"),
  align: z.enum(["left", "center"]).default("left"),
  ...appearance,
});

const quote = z.object({
  quote: z.string().min(1).max(400),
  attribution: z.string().max(80).optional(),
  portrait: image.optional(),
  script: z.boolean().optional(),
  ...appearance,
});

const column = z.object({
  heading: z.string().max(60).optional(),
  body: z.string().min(1),
});
const twoColumnText = z.object({ left: column, right: column, ...appearance });

const ctaBanner = z.object({
  heading: z.string().min(1).max(80),
  body: z.string().max(300).optional(),
  buttons: buttons.default([]),
  ...appearance,
});

const imageGallery = z.object({
  items: z
    .array(z.object({ image, caption: z.string().max(140).optional() }))
    .min(1),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
  layout: z.enum(["grid", "masonry"]).default("grid"),
  ...appearance,
});

const video = z
  .object({
    url: z.string().url().optional(),
    fileUrl: z.string().optional(),
    poster: image.optional(),
    caption: z.string().max(160).optional(),
    ...appearance,
  })
  .refine((v) => v.url || v.fileUrl, {
    message: "Add a YouTube/Vimeo link or an uploaded video",
  });

const statsRow = z.object({
  items: z
    .array(
      z.object({
        value: z.string().min(1).max(16),
        label: z.string().min(1).max(40),
      }),
    )
    .min(1)
    .max(6),
  ...appearance,
});

const iconName = z.enum([
  "none",
  "check",
  "star",
  "book",
  "mic",
  "stage",
  "heart",
]);
const listFeature = z.object({
  eyebrow: z.string().max(40).optional(),
  heading: z.string().max(60).optional(),
  intro: z.string().max(400).optional(),
  items: z
    .array(
      z.object({
        title: z.string().min(1).max(120),
        text: z.string().max(300).optional(),
        icon: iconName.optional(),
      }),
    )
    .min(1),
  columns: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(3),
  ...appearance,
});

const testimonials = z.object({
  eyebrow: z.string().max(40).optional(),
  heading: z.string().max(60).optional(),
  context: z.enum(["speaking", "book"]).optional(),
  layout: z.enum(["grid", "carousel"]).default("grid"),
  ...appearance,
});

const logoStrip = z.object({
  heading: z.string().max(60).optional(),
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(60),
        href: z.string().optional(),
        image: image.optional(),
      }),
    )
    .min(1),
  ...appearance,
});

const faq = z.object({
  eyebrow: z.string().max(40).optional(),
  heading: z.string().max(60).optional(),
  items: z
    .array(
      z.object({
        question: z.string().min(1).max(200),
        answer: z.string().min(1),
      }),
    )
    .min(1),
  ...appearance,
});

const creditsList = z.object({
  eyebrow: z.string().max(40).optional(),
  heading: z.string().max(60).optional(),
  category: z.enum(["stage", "film_tv", "other"]).optional(),
  featuredOnly: z.boolean().default(false),
  ...appearance,
});

const bookGrid = z.object({
  status: z.enum(["available", "coming_soon"]).optional(),
  ...appearance,
});

const eventList = z.object({
  scope: z.enum(["upcoming", "past", "both"]).default("both"),
  emptyText: z
    .string()
    .max(200)
    .default("New dates are on the way. Join the mailing list to hear first."),
  emptyLinkLabel: z.string().max(60).default("Book Tangie for your event"),
  emptyLinkHref: z.string().default("/speaking#inquiry"),
  ...appearance,
});

const postGrid = z.object({
  perPage: z.number().int().min(3).max(24).default(9),
  ...appearance,
});

const formText = {
  eyebrow: z.string().max(40).optional(),
  heading: z.string().max(60).optional(),
  intro: z.string().max(400).optional(),
};
const contactForm = z.object({
  ...formText,
  presetType: z.enum(INQUIRY_TYPES).optional(),
  ...appearance,
});
const bookingForm = z.object({ ...formText, ...appearance });

const downloads = z.object({
  eyebrow: z.string().max(40).optional(),
  heading: z.string().max(60).optional(),
  items: z
    .array(
      z.object({
        label: z.string().min(1).max(80),
        description: z.string().max(160).optional(),
        mediaId: z.string().optional(),
        url: z
          .string()
          .refine(
            (u) => u.startsWith("/media/") || u.startsWith("https://"),
            "Must be an uploaded file or an https link",
          ),
        fileType: z.string().max(12).optional(),
        sizeLabel: z.string().max(16).optional(),
      }),
    )
    .min(1),
  ...appearance,
});

const embed = z.object({
  url: z
    .string()
    .refine(
      isAllowedEmbed,
      "Only YouTube, Vimeo, Eventbrite, Spotify and Google Maps can be embedded",
    ),
  title: z.string().min(1).max(120),
  height: z.number().int().min(200).max(900).default(480),
  ...appearance,
});

const spacerDivider = z.object({
  size: z.enum(["small", "medium", "large"]).default("medium"),
  rule: z.boolean().default(false),
});

/** What a section can know about the request it is rendered for. */
export type SectionContext = {
  pathname: string;
  searchParams: Record<string, string | string[] | undefined>;
};

const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

type SectionDef<S extends z.ZodType, E = undefined> = {
  label: string;
  description: string;
  schema: S;
  /** Loads any database content the section shows. */
  load?: (props: z.output<S>, ctx: SectionContext) => Promise<E>;
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
        {
          label: "Learn More",
          href: learnMore,
          variant: "filled" as const,
          srText: book ? `about ${book.title}` : "about the book",
        },
        ...(book
          ? [
              {
                label: "Buy the Book",
                href: book.buyUrl ?? `${learnMore}#buy`,
                variant: "outline" as const,
                newTab: Boolean(book.buyUrl),
                track: "book_purchase_click",
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

  // ---- building blocks for new pages -------------------------------------
  page_hero: define({
    label: "Page header",
    description: "Heading and intro at the top of an inner page.",
    schema: pageHero,
    render: (p) => <PageHero {...p} />,
  }),
  rich_text: define({
    label: "Text",
    description: "Free-form article-style text with headings, lists and links.",
    schema: richText,
    render: (p) => <RichText {...p} />,
  }),
  quote: define({
    label: "Pull quote",
    description: "A large quotation with an attribution.",
    schema: quote,
    render: (p) => <Quote {...p} />,
  }),
  two_column_text: define({
    label: "Two columns of text",
    description: "Two text columns side by side.",
    schema: twoColumnText,
    render: (p) => <TwoColumnText {...p} />,
  }),
  cta_banner: define({
    label: "Call to action",
    description: "A heading, a sentence and up to two buttons.",
    schema: ctaBanner,
    render: (p) => <CtaBanner {...p} />,
  }),
  image_gallery: define({
    label: "Photo gallery",
    description: "A grid of photos that open in a viewer.",
    schema: imageGallery,
    render: (p) => <ImageGallery {...p} />,
  }),
  video: define({
    label: "Video",
    description: "A YouTube or Vimeo video, or an uploaded one.",
    schema: video,
    render: (p) => <Video {...p} />,
  }),
  stats_row: define({
    label: "Numbers",
    description: "Big numbers with short labels.",
    schema: statsRow,
    render: (p) => <StatsRow {...p} />,
  }),
  list_feature: define({
    label: "List of features",
    description:
      "A heading and a list of short points (facts, topics, offerings).",
    schema: listFeature,
    render: (p) => <ListFeature {...p} />,
  }),
  testimonials: define({
    label: "Testimonials",
    description: "Approved testimonials. Hidden until some exist.",
    schema: testimonials,
    load: (p) => getTestimonials(p.context),
    render: (p, items) => <Testimonials {...p} testimonials={items} />,
  }),
  logo_strip: define({
    label: "Logos",
    description: "A row of partner or press logos.",
    schema: logoStrip,
    render: (p) => <LogoStrip {...p} />,
  }),
  faq: define({
    label: "Questions and answers",
    description: "An accordion of frequently asked questions.",
    schema: faq,
    render: (p) => <Faq {...p} />,
  }),
  credits_list: define({
    label: "Film and theater credits",
    description:
      "Credits grouped by stage and screen, with roles and watch links.",
    schema: creditsList,
    load: (p) =>
      getCredits({ category: p.category, featuredOnly: p.featuredOnly }),
    render: (p, credits) => <CreditsList {...p} credits={credits} />,
  }),
  book_grid: define({
    label: "Books",
    description: "All published books with their cover and status.",
    schema: bookGrid,
    load: (p) => getBooks(p.status),
    render: (p, books) => <BookGrid {...p} books={books} />,
  }),
  event_list: define({
    label: "Events",
    description: "Upcoming events and a past-events archive.",
    schema: eventList,
    load: (p) => getEventList(p.scope),
    render: (p, data) => <EventList {...p} data={data} />,
  }),
  post_grid: define({
    label: "Journal posts",
    description: "Journal posts with category filter and pages.",
    schema: postGrid,
    load: async (p, ctx) => {
      const category = first(ctx.searchParams.category);
      const page = Math.max(
        1,
        Number.parseInt(first(ctx.searchParams.page) ?? "1", 10) || 1,
      );
      const [data, categories] = await Promise.all([
        getPostsPage(page, p.perPage, category),
        getJournalCategories(),
      ]);
      return { data, categories, category, basePath: ctx.pathname };
    },
    render: (p, x) => (
      <PostGrid
        {...p}
        data={x.data}
        categories={x.categories}
        activeCategory={x.category}
        basePath={x.basePath}
      />
    ),
  }),
  contact_form: define({
    label: "Contact form",
    description: "General enquiry form.",
    schema: contactForm,
    load: async (p, ctx) => {
      const MAP: Record<string, string> = {
        general: "General",
        booking: "Booking / Speaking",
        media: "Media / Press",
        books: "Books / Book Club",
        collaboration: "Collaboration",
      };
      const q = first(ctx.searchParams.type);
      return p.presetType ?? (q ? MAP[q] : undefined);
    },
    render: (p, preset) => <ContactForm {...p} presetType={preset} />,
  }),
  booking_form: define({
    label: "Speaking booking form",
    description: "Request Tangie for an event.",
    schema: bookingForm,
    render: (p) => <BookingForm {...p} />,
  }),
  downloads: define({
    label: "Downloads",
    description: "Files to download (press kit, headshots).",
    schema: downloads,
    render: (p) => <Downloads {...p} />,
  }),
  embed: define({
    label: "Embed",
    description:
      "An embedded page from YouTube, Vimeo, Eventbrite, Spotify or Google Maps.",
    schema: embed,
    render: (p) => <Embed {...p} />,
  }),
  spacer_divider: define({
    label: "Space / divider",
    description: "Extra space with an optional thin line.",
    schema: spacerDivider,
    render: (p) => <SpacerDivider {...p} />,
  }),
};

export type SectionType = keyof typeof registry;

export function isSectionType(type: string): type is SectionType {
  return type in registry;
}
