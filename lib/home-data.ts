// Hard-coded homepage content for M2, taken from SITE_CONTENT.md.
// M3 replaces this file with the seeded section stack from the database.
// Images are temporary stand-ins from seed-assets/ (public/dev-seed/ is deleted in M3).

import type { HeroSplitProps } from "@/components/sections/HeroSplit";
import type { FeatureBookProps } from "@/components/sections/FeatureBook";
import type { ImageTextProps } from "@/components/sections/ImageText";
import type { DarkFeatureProps } from "@/components/sections/DarkFeature";
import type { EventCardsProps } from "@/components/sections/EventCards";
import type { PostCardsProps } from "@/components/sections/PostCards";
import type { NewsletterProps } from "@/components/sections/Newsletter";

export const hero: HeroSplitProps = {
  titleLine1: "Tangie",
  titleLine2: "Brickhouse-Beaty",
  roleLine: "Author | Playwright | Director | Producer",
  body: "Tangie Brickhouse-Beaty is an author, playwright, director, and producer whose work spans books, stage, and screen.",
  buttons: [
    {
      label: "Explore the Book",
      href: "/books/justified-lies",
      variant: "filled",
    },
    { label: "Speaking & Bookings", href: "/speaking", variant: "outline" },
  ],
  image: {
    src: "/dev-seed/hero.jpeg",
    alt: "Tangie Brickhouse-Beaty smiling at her laptop",
    width: 800,
    height: 867,
    focal: [0.5, 0.15],
  },
  imageSide: "right",
};

export const featuredBook: FeatureBookProps = {
  eyebrow: "Featured Book",
  heading: "Justified Lies",
  headingItalic: true,
  body: "*Justified Lies* is a compelling novel that explores the complexities of relationships, faith, and the choices that shape our lives.",
  buttons: [
    { label: "Learn More", href: "/books/justified-lies", variant: "filled" },
    // TODO(client): purchase URL (Stripe Payment Link or retailers). Points to the book page until supplied.
    {
      label: "Buy the Book",
      href: "/books/justified-lies#buy",
      variant: "outline",
    },
  ],
  image: {
    src: "/dev-seed/book-cover.jpeg",
    alt: "Justified Lies book cover by Tangie Brickhouse Beaty",
    width: 1728,
    height: 2592,
  },
  // TODO(client): lifestyle photo of the book (marble surface); cover shown until then
  imageFit: "contain",
  imageSide: "left",
};

export const meetTangie: ImageTextProps = {
  eyebrow: "Meet Tangie",
  heading: "Author. Playwright.\nDirector. Producer.",
  body: "Tangie Brickhouse-Beaty's work spans books, stage, and screen. She creates stories that explore the complexities of life, faith, relationships, and redemption.",
  buttons: [{ label: "About Tangie", href: "/about", variant: "filled" }],
  image: {
    src: "/dev-seed/meet.jpeg",
    alt: "Black-and-white portrait of Tangie Brickhouse-Beaty",
    width: 704,
    height: 1472,
    focal: [0.5, 0.4],
  },
  imageSide: "left",
  imageStyle: "framed",
};

export const filmTheater: DarkFeatureProps = {
  eyebrow: "Film & Theater",
  heading: "Stories Beyond the Page",
  body: "From powerful stage productions to film, Tangie Brickhouse-Beaty brings compelling stories to life. Explore her writing, directing, producing, and casting work, including *Secrets in Plain Sight* and other notable productions.",
  buttons: [
    {
      label: "Explore Film & Theater",
      href: "/film-theater",
      variant: "filled",
    },
  ],
  // TODO(client): stage / production photo. Stand-in is an event photo that carries a photographer credit; confirm licensing or replace.
  image: {
    src: "/dev-seed/stage.jpeg",
    alt: "Tangie Brickhouse-Beaty speaking on a stage lit in purple",
    width: 1404,
    height: 936,
    focal: [0.5, 0.35],
  },
};

export const speaking: ImageTextProps = {
  eyebrow: "Speaking",
  heading: "Engage. Inspire. Connect.",
  body: "Tangie is available for author talks, book clubs, faith-based events, workshops, panels, and more. Bring her to your next event.",
  buttons: [
    { label: "Book Tangie", href: "/speaking#inquiry", variant: "filled" },
  ],
  image: {
    src: "/dev-seed/stage.jpeg",
    alt: "Tangie Brickhouse-Beaty speaking at a microphone",
    width: 1404,
    height: 936,
    focal: [0.45, 0.3],
  },
  imageSide: "left",
  imageStyle: "bleed",
};

// No upcoming events exist yet, so the empty state shows (never the mockup's placeholder events).
export const events: EventCardsProps = {
  eyebrow: "Upcoming Events",
  heading: "Where to See Tangie",
  linkLabel: "View all events",
  linkHref: "/events",
  events: [],
  emptyText: "New dates are on the way. Join the mailing list to hear first.",
  emptyLinkLabel: "Book Tangie for your event",
  emptyLinkHref: "/speaking#inquiry",
};

export const journal: PostCardsProps = {
  eyebrow: "From the Journal",
  heading: "Latest Reflections",
  linkLabel: "View all posts",
  linkHref: "/journal",
  posts: [
    {
      slug: "praise-god-for-closed-doors",
      title: "Praise God for Closed Doors: Your Only Way is Forward!",
      date: "December 14, 2025",
      // TODO(client): cover image (the Wix one was a stock photo)
    },
    {
      slug: "the-real-battle",
      title: "The Real Battle: Aligning What You See with What You Do",
      date: "December 14, 2025",
      // TODO(client): cover image (the Wix one was a stock photo)
    },
    {
      slug: "your-time-your-truth",
      title: "Your Time, Your Truth: Why You Must Guard Your Divine Assignment",
      date: "December 14, 2025",
      image: {
        src: "/dev-seed/journal-your-time.jpeg",
        alt: "Cover image for Your Time, Your Truth",
        width: 1024,
        height: 768,
      },
    },
  ],
};

export const newsletter: NewsletterProps = {
  eyebrow: "Stay Connected",
  heading: "Join the Mailing List",
  body: "Be the first to hear about new books, events, and updates.",
  buttonLabel: "Subscribe",
  successMessage: "Check your inbox to confirm.",
  // TODO(client): books-and-plant photo. Brand quill icon is a stand-in.
  image: {
    src: "/dev-seed/quill.png",
    alt: "",
    width: 500,
    height: 500,
    focal: [0.7, 0.5],
  },
};
