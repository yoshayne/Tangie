/**
 * Starting section stacks for the inner pages. All copy comes from SITE_CONTENT.md; anything the
 * client still has to supply is marked TODO(client). Pages that already exist are never touched.
 */
import type { ImageRef } from "@/lib/sections/types";
import * as content from "./seed-content";

export type PageSeed = {
  slug: string;
  title: string;
  seoDescription?: string;
  template?: "standard" | "book_detail" | "event_detail" | "post_detail";
  stack: Array<{
    type: string;
    props: Record<string, unknown>;
    anchorId?: string;
    hidden?: boolean;
  }>;
};

type Img = (
  slot: string,
  over?: { alt?: string; focal?: [number, number] },
) => ImageRef;

const WELCOME =
  "Whether you're here to book me, collaborate, explore the stories, or simply take a look around—welcome. The journey is just beginning, and this space was created with you in mind. I'm honored you're here.";

const newsletter = {
  type: "newsletter",
  anchorId: "mailing-list",
  props: {
    eyebrow: "Stay Connected",
    heading: "Join the Mailing List",
    body: "Be the first to hear about new books, events, and updates.",
    buttonLabel: "Subscribe",
    successMessage: "Check your inbox to confirm.",
  },
};

const comingSoonLegal = (what: string) =>
  `<p>${what} is being prepared and will be published here before the site launches.</p>`;

export function buildInnerPages(
  img: Img,
  files: {
    logoUrl?: string;
    logoSize?: string;
    coverUrl?: string;
    coverSize?: string;
  },
): PageSeed[] {
  const sizeLabel = (n?: string) => n;
  return [
    {
      slug: "about",
      title: "About",
      seoDescription:
        "Award-winning playwright, director, and producer, now author: Tangie Brickhouse-Beaty creates stories rooted in faith, truth, and imagination.",
      stack: [
        {
          type: "page_hero",
          props: {
            eyebrow: "About",
            heading: "Tangie Brickhouse-Beaty",
            intro:
              "Stories that Heal. Truth that Confronts. Faith that Endures.",
          },
        },
        {
          // TODO(client): full long-form biography (the old site's "Read Full Bio" had no page).
          type: "image_text",
          props: {
            eyebrow: "The journey",
            heading: "Author. Playwright.\nDirector. Producer.",
            body: "Award-winning playwright, director, and producer —now author— Tangie Brickhouse-Beaty launches her debut novel, an emotionally gripping story of love, lies, and redemption.",
            buttons: [
              {
                label: "Explore the Book",
                href: "/books/justified-lies",
                variant: "filled",
              },
            ],
            image: img("home.hero.image", { focal: [0.5, 0.2] }),
            imageSide: "left",
            imageStyle: "framed",
          },
        },
        {
          type: "quote",
          props: {
            quote:
              "I create bold, emotionally honest stories—rooted in faith, truth, and imagination—that move people, spark conversation, and leave a lasting impact.",
            attribution: "Tangie Brickhouse-Beaty",
            background: "sand",
          },
        },
        {
          type: "list_feature",
          props: {
            eyebrow: "Quick facts",
            heading: "A little about Tangie",
            items: content.quickFacts.map((title) => ({ title })),
            columns: 2,
          },
        },
        {
          type: "quote",
          props: {
            quote:
              "If the story makes me laugh, cry, and question my life choices… I've probably told too much and need to make sure nothing will get me in trouble. Then it's probably ready.",
            attribution: "Tangie Brickhouse-Beaty",
            background: "ink",
          },
        },
        {
          type: "logo_strip",
          props: {
            heading: "Affiliated with",
            items: [
              { name: "WOW Studio One", href: "https://www.wowstudioone.com" },
              {
                name: "Destined 2 WOW Foundation",
                href: "https://www.wow-pac.org",
              },
            ],
          },
        },
        {
          type: "cta_banner",
          props: {
            heading: "Bring Tangie to your next event",
            body: "Author talks, book clubs, faith-based events, workshops, panels, and more.",
            buttons: [
              {
                label: "Book Tangie",
                href: "/speaking#inquiry",
                variant: "filled",
              },
              { label: "Contact", href: "/contact", variant: "outline" },
            ],
            background: "sand",
          },
        },
      ],
    },
    {
      slug: "speaking",
      title: "Speaking",
      seoDescription:
        "Book Tangie Brickhouse-Beaty for author talks, book clubs, faith-based events, workshops, panels, and more.",
      stack: [
        {
          type: "page_hero",
          props: {
            eyebrow: "Speaking",
            heading: "Engage. Inspire. Connect.",
            intro:
              "Looking for a speaker who is engaging, insightful, and knows how to connect with any audience no matter the age? You should book Tangie Brickhouse-Beaty!",
          },
        },
        {
          type: "rich_text",
          props: {
            body: "<p>With heart, humor, and depth, Tangie brings stories to life—sparking meaningful conversation and creating experiences audiences remember long after the event ends.</p>",
            background: "ivory",
            spacing: "compact",
          },
        },
        {
          type: "list_feature",
          props: {
            eyebrow: "Topics",
            heading: "What Tangie speaks on",
            items: content.speakingTopics.map((title, i) => ({
              title,
              icon: (["book", "heart", "star", "mic", "stage"] as const)[i % 5],
            })),
            columns: 3,
            background: "ivory",
          },
        },
        {
          type: "image_gallery",
          props: {
            items: [
              {
                image: img("home.speaking.image", {
                  alt: "Tangie Brickhouse-Beaty speaking at a microphone",
                }),
              },
              { image: img("home.meet.image") },
              { image: img("home.hero.image", { focal: [0.5, 0.2] }) },
            ],
            columns: 3,
            layout: "grid",
            background: "ivory-deep",
          },
        },
        {
          type: "rich_text",
          props: {
            body: "<p>Tangie's story is one that will inspire, empower, and bless audiences everywhere.</p>",
            align: "center",
            maxWidth: "narrow",
          },
        },
        // Hidden until approved testimonials exist (it also renders nothing while there are none).
        {
          type: "testimonials",
          props: {
            eyebrow: "Kind words",
            heading: "What people say",
            context: "speaking",
          },
        },
        {
          type: "booking_form",
          anchorId: "inquiry",
          props: {
            eyebrow: "Book Tangie",
            heading: "Request Tangie for your event",
            intro: "Tell us a little about your event.",
            background: "ivory-deep",
          },
        },
      ],
    },
    {
      slug: "books",
      title: "Books",
      seoDescription:
        "Books by Tangie Brickhouse-Beaty, including the debut novel Justified Lies.",
      stack: [
        {
          type: "page_hero",
          props: {
            eyebrow: "Books",
            heading: "Books",
            intro:
              "My stories live at the intersection of secrets, survival, faith, and family - where love is complicated, and truth always comes with a cost.",
          },
        },
        { type: "book_grid", props: { spacing: "compact" } },
        newsletter,
      ],
    },
    {
      slug: "events",
      title: "Events",
      seoDescription:
        "Where to see Tangie Brickhouse-Beaty: upcoming events and highlights from past ones.",
      stack: [
        {
          type: "page_hero",
          props: { eyebrow: "Events", heading: "Where to See Tangie" },
        },
        {
          type: "event_list",
          props: {
            scope: "both",
            emptyText:
              "New dates are on the way. Join the mailing list to hear first.",
            emptyLinkLabel: "Book Tangie for your event",
            emptyLinkHref: "/speaking#inquiry",
            spacing: "compact",
          },
        },
        newsletter,
      ],
    },
    {
      slug: "journal",
      title: "Journal",
      seoDescription:
        "Behind the scenes, lessons learned, faith, leadership, and storytelling from Tangie Brickhouse-Beaty.",
      stack: [
        {
          type: "page_hero",
          props: {
            eyebrow: "From the Journal",
            heading: "Latest Reflections",
            intro:
              'Behind the scenes. Lessons learned. Funny real-life moments. Faith, leadership, storytelling - and the occasional "Lord, it wasn\'t my fault."',
          },
        },
        { type: "post_grid", props: { perPage: 9, spacing: "compact" } },
        newsletter,
      ],
    },
    {
      slug: "film-theater",
      title: "Film & Theater",
      seoDescription:
        "The writing, directing, producing, and casting work of Tangie Brickhouse-Beaty, including the TV series Secrets in Plain Sight.",
      stack: [
        {
          type: "page_hero",
          props: {
            eyebrow: "Film & Theater",
            heading: "Stories Beyond the Page",
            intro:
              "From powerful stage productions to film, Tangie Brickhouse-Beaty brings compelling stories to life. Explore her writing, directing, producing, and casting work, including Secrets in Plain Sight and other notable productions.",
          },
        },
        {
          type: "stats_row",
          props: {
            items: [
              { value: "24+", label: "Years writing, directing, producing" },
              { value: "1st", label: "Black Box Theatre in SC" },
            ],
            background: "sand",
            spacing: "compact",
          },
        },
        // TODO(client): full credits list (title, year, category, roles) and the Tubi / Peacock links.
        {
          type: "credits_list",
          props: { eyebrow: "Credits", heading: "Selected work" },
        },
        {
          type: "cta_banner",
          props: {
            heading: "Collaborate with Tangie",
            buttons: [
              {
                label: "Get in touch",
                href: "/contact?type=collaboration",
                variant: "filled",
              },
            ],
            background: "ink",
          },
        },
      ],
    },
    {
      slug: "contact",
      title: "Contact",
      seoDescription: "Get in touch with Tangie Brickhouse-Beaty.",
      stack: [
        {
          type: "page_hero",
          props: {
            eyebrow: "Contact",
            heading: "Get in touch",
            intro: WELCOME,
          },
        },
        // TODO(client): phone and email are not shown until approved for public display.
        { type: "contact_form", props: { spacing: "compact" } },
      ],
    },
    {
      slug: "press",
      title: "Press",
      seoDescription:
        "Press kit for Tangie Brickhouse-Beaty: logo and book cover downloads.",
      stack: [
        {
          type: "page_hero",
          props: {
            eyebrow: "Press",
            heading: "Press kit",
            intro: "Logos and images for media use.",
          },
        },
        // TODO(client): short and long bio, headshots, verified credits, media contact.
        {
          type: "downloads",
          props: {
            eyebrow: "Downloads",
            heading: "Logo and cover",
            items: [
              ...(files.logoUrl
                ? [
                    {
                      label: "Logo (white lettering, transparent)",
                      url: files.logoUrl,
                      fileType: "WEBP",
                      sizeLabel: sizeLabel(files.logoSize),
                    },
                  ]
                : []),
              ...(files.coverUrl
                ? [
                    {
                      label: "Justified Lies cover",
                      url: files.coverUrl,
                      fileType: "WEBP",
                      sizeLabel: sizeLabel(files.coverSize),
                    },
                  ]
                : []),
            ],
            spacing: "compact",
          },
        },
        {
          type: "cta_banner",
          props: {
            heading: "Media inquiries",
            buttons: [
              {
                label: "Contact",
                href: "/contact?type=media",
                variant: "filled",
              },
            ],
            background: "sand",
          },
        },
      ],
    },
    {
      // TODO(client): privacy policy text.
      slug: "privacy",
      title: "Privacy Policy",
      stack: [
        { type: "page_hero", props: { heading: "Privacy Policy" } },
        {
          type: "rich_text",
          props: {
            body: comingSoonLegal("The privacy policy"),
            spacing: "compact",
          },
        },
      ],
    },
    {
      // TODO(client): terms text.
      slug: "terms",
      title: "Terms",
      stack: [
        { type: "page_hero", props: { heading: "Terms" } },
        {
          type: "rich_text",
          props: {
            body: comingSoonLegal("The terms of use"),
            spacing: "compact",
          },
        },
      ],
    },
    // Shared "below the content" stacks for detail pages (hidden pages, not routable).
    {
      slug: "_template/book",
      title: "Book page: below the content",
      template: "book_detail",
      stack: [newsletter],
    },
    {
      slug: "_template/event",
      title: "Event page: below the content",
      template: "event_detail",
      stack: [newsletter],
    },
    {
      slug: "_template/post",
      title: "Journal post: below the content",
      template: "post_detail",
      stack: [newsletter],
    },
  ];
}
