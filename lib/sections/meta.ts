/**
 * What the page builder needs to know about each section type, without importing any React
 * components: the label shown in the picker, the starting content, and the editor fields.
 * The matching zod schemas (which decide what is valid) live in registry.tsx; a script
 * (`npm run check:sections`) fails if the two ever disagree about which types exist.
 */

export type Option = [value: string, label: string];

type Base = { name: string; label: string; hint?: string };

export type FieldSpec =
  | (Base & {
      kind: "text";
      max?: number;
      required?: boolean;
      /** Offers the site's pages as suggestions (for link fields). */
      link?: boolean;
    })
  | (Base & {
      kind: "textarea";
      max?: number;
      rows?: number;
      required?: boolean;
    })
  | (Base & { kind: "richtext"; required?: boolean })
  | (Base & {
      kind: "image";
      required?: boolean;
      /** Shapes of the frame the photo sits in (width ÷ height), for the position tool. */
      aspects?: (
        props: Record<string, unknown>,
      ) => Array<[label: string, ratio: number]>;
    })
  | (Base & { kind: "buttons" })
  | (Base & { kind: "select"; options: Option[]; numeric?: boolean })
  | (Base & { kind: "bookSelect" })
  | (Base & { kind: "toggle" })
  | (Base & { kind: "number"; min: number; max: number })
  | (Base & { kind: "color" })
  | (Base & {
      kind: "repeater";
      itemLabel: string;
      titleField?: string;
      min?: number;
      max?: number;
      fields: FieldSpec[];
    })
  | (Base & { kind: "group"; fields: FieldSpec[] })
  | (Base & { kind: "video" })
  | (Base & { kind: "downloadFile" });

export type SectionGroup = "Page" | "Content" | "Pulls from the site" | "Forms";

export type SectionMeta = {
  label: string;
  description: string;
  icon: string;
  group: SectionGroup;
  defaults: Record<string, unknown>;
  fields: FieldSpec[];
  /** The three mockup sections whose look is fixed have no background/spacing options. */
  appearance: boolean;
};

const BG: Option[] = [
  ["ivory", "Ivory"],
  ["ivory-deep", "Deep ivory"],
  ["sand", "Sand"],
  ["white", "White"],
  ["ink", "Dark (light text)"],
];

const appearanceFields: FieldSpec[] = [
  { kind: "color", name: "background", label: "Background" },
  {
    kind: "select",
    name: "spacing",
    label: "Space above and below",
    options: [
      ["", "Normal"],
      ["compact", "Compact"],
      ["spacious", "Spacious"],
    ],
  },
];
export const BACKGROUNDS = BG;

const eyebrow: FieldSpec = {
  kind: "text",
  name: "eyebrow",
  label: "Small label above the heading",
  max: 40,
};
const side = (def: string): FieldSpec => ({
  kind: "select",
  name: "imageSide",
  label: "Photo side",
  options: [
    ["left", "Left"],
    ["right", "Right"],
  ],
  hint: `Default: ${def}`,
});
const buttons: FieldSpec = {
  kind: "buttons",
  name: "buttons",
  label: "Buttons",
};

export const SECTION_META: Record<string, SectionMeta> = {
  hero_split: {
    label: "Hero (split)",
    description: "Large name and intro on one side, portrait on the other.",
    icon: "◧",
    group: "Page",
    appearance: false,
    defaults: {
      titleLine1: "New page",
      titleLine2: "",
      roleLine: "",
      body: "Write a short introduction here.",
      buttons: [],
      imageSide: "right",
    },
    fields: [
      {
        kind: "text",
        name: "titleLine1",
        label: "Name, line 1",
        max: 14,
        required: true,
        hint: "Keep it short (14 letters or fewer) so it fits.",
      },
      { kind: "text", name: "titleLine2", label: "Name, line 2", max: 24 },
      {
        kind: "text",
        name: "roleLine",
        label: "Role line",
        max: 120,
        hint: "Separate with | e.g. AUTHOR | PLAYWRIGHT",
      },
      {
        kind: "textarea",
        name: "body",
        label: "Introduction",
        max: 400,
        required: true,
      },
      buttons,
      {
        kind: "image",
        name: "image",
        label: "Portrait",
        required: true,
        aspects: () => [
          ["On a computer", 1.18],
          ["On a phone", 0.8],
        ],
      },
      side("right"),
    ],
  },
  feature_book: {
    label: "Featured book",
    description: "Book photo beside its title, blurb and buy buttons.",
    icon: "▤",
    group: "Content",
    appearance: false,
    defaults: {
      eyebrow: "Featured book",
      headingItalic: true,
      imageFit: "cover",
      imageSide: "left",
    },
    fields: [
      eyebrow,
      {
        kind: "bookSelect",
        name: "bookSlug",
        label: "Book",
        hint: "Its title, blurb and buy link fill in automatically unless you type your own below.",
      },
      {
        kind: "text",
        name: "heading",
        label: "Heading (optional override)",
        max: 60,
      },
      {
        kind: "toggle",
        name: "headingItalic",
        label: "Show the heading in italics",
      },
      {
        kind: "textarea",
        name: "body",
        label: "Text (optional override)",
        max: 500,
      },
      buttons,
      {
        kind: "image",
        name: "image",
        label: "Photo",
        required: true,
        aspects: (p) =>
          p.imageFit === "contain"
            ? []
            : [
                ["On a computer", 1.78],
                ["On a phone", 1],
              ],
      },
      {
        kind: "select",
        name: "imageFit",
        label: "Photo fit",
        options: [
          ["cover", "Fill the space"],
          ["contain", "Show the whole photo"],
        ],
      },
      side("left"),
    ],
  },
  image_text: {
    label: "Photo and text",
    description: "A photo beside a heading, paragraph and buttons.",
    icon: "◫",
    group: "Content",
    appearance: false,
    defaults: {
      eyebrow: "About",
      heading: "A new section",
      body: "Write a short paragraph here. Put *asterisks* around a word to make it italic.",
      buttons: [],
      imageSide: "left",
      imageStyle: "framed",
    },
    fields: [
      eyebrow,
      {
        kind: "text",
        name: "heading",
        label: "Heading",
        max: 80,
        required: true,
      },
      {
        kind: "textarea",
        name: "body",
        label: "Text",
        max: 600,
        required: true,
        hint: "Put *asterisks* around a word to make it italic.",
      },
      buttons,
      {
        kind: "image",
        name: "image",
        label: "Photo",
        required: true,
        aspects: (p) =>
          p.imageStyle === "bleed"
            ? [
                ["On a computer", 2.1],
                ["On a phone", 1.6],
              ]
            : [["Photo frame", 1.14]],
      },
      side("left"),
      {
        kind: "select",
        name: "imageStyle",
        label: "Photo style",
        options: [
          ["framed", "Framed"],
          ["bleed", "Edge to edge"],
        ],
      },
    ],
  },
  dark_feature: {
    label: "Dark feature",
    description: "A dark band with text and a photo that fades into it.",
    icon: "◨",
    group: "Content",
    appearance: false,
    defaults: {
      eyebrow: "Feature",
      heading: "A new section",
      body: "Write a short paragraph here.",
      buttons: [],
    },
    fields: [
      eyebrow,
      {
        kind: "text",
        name: "heading",
        label: "Heading",
        max: 60,
        required: true,
      },
      {
        kind: "textarea",
        name: "body",
        label: "Text",
        max: 600,
        required: true,
        hint: "Put *asterisks* around a word to make it italic.",
      },
      buttons,
      {
        kind: "image",
        name: "image",
        label: "Photo",
        aspects: () => [
          ["On a computer", 2.4],
          ["On a phone", 16 / 9],
        ],
      },
    ],
  },
  event_cards: {
    label: "Upcoming events (cards)",
    description: "The next few events as cards.",
    icon: "▦",
    group: "Pulls from the site",
    appearance: false,
    defaults: {
      eyebrow: "Upcoming events",
      heading: "Where to See Tangie",
      linkLabel: "View all events",
      linkHref: "/events",
      count: 3,
      layout: "grid",
      emptyText:
        "New dates are on the way. Join the mailing list to hear first.",
      emptyLinkLabel: "Book Tangie for your event",
      emptyLinkHref: "/speaking#inquiry",
    },
    fields: [
      eyebrow,
      {
        kind: "text",
        name: "heading",
        label: "Heading",
        max: 60,
        required: true,
      },
      {
        kind: "text",
        name: "linkLabel",
        label: "Link text",
        max: 40,
        required: true,
      },
      {
        kind: "text",
        name: "linkHref",
        label: "Link address",
        link: true,
        required: true,
      },
      {
        kind: "number",
        name: "count",
        label: "How many events",
        min: 1,
        max: 6,
      },
      {
        kind: "select",
        name: "layout",
        label: "Layout",
        options: [
          ["grid", "Three columns"],
          ["list", "List"],
        ],
      },
      {
        kind: "textarea",
        name: "emptyText",
        label: "Text when there are no events",
        max: 200,
        required: true,
      },
      {
        kind: "text",
        name: "emptyLinkLabel",
        label: "Link text when there are no events",
        max: 60,
        required: true,
      },
      {
        kind: "text",
        name: "emptyLinkHref",
        label: "Link address when there are no events",
        link: true,
        required: true,
      },
    ],
  },
  post_cards: {
    label: "Latest journal posts (cards)",
    description: "The newest journal posts as cards.",
    icon: "▥",
    group: "Pulls from the site",
    appearance: false,
    defaults: {
      eyebrow: "From the journal",
      heading: "Latest Reflections",
      linkLabel: "View all posts",
      linkHref: "/journal",
      count: 3,
    },
    fields: [
      eyebrow,
      {
        kind: "text",
        name: "heading",
        label: "Heading",
        max: 60,
        required: true,
      },
      {
        kind: "text",
        name: "linkLabel",
        label: "Link text",
        max: 40,
        required: true,
      },
      {
        kind: "text",
        name: "linkHref",
        label: "Link address",
        link: true,
        required: true,
      },
      {
        kind: "select",
        name: "count",
        label: "How many posts",
        numeric: true,
        options: [
          ["3", "3"],
          ["6", "6"],
          ["9", "9"],
        ],
      },
      {
        kind: "text",
        name: "category",
        label: "Only this category (optional)",
        max: 60,
      },
    ],
  },
  newsletter: {
    label: "Mailing list sign-up",
    description: "Email sign-up band.",
    icon: "✉",
    group: "Forms",
    appearance: false,
    defaults: {
      eyebrow: "Stay connected",
      heading: "Join the Mailing List",
      body: "Be the first to hear about new books, events, and updates.",
      buttonLabel: "Subscribe",
      successMessage: "Check your inbox to confirm.",
    },
    fields: [
      eyebrow,
      {
        kind: "text",
        name: "heading",
        label: "Heading",
        max: 60,
        required: true,
      },
      {
        kind: "textarea",
        name: "body",
        label: "Text",
        max: 200,
        required: true,
      },
      { kind: "text", name: "buttonLabel", label: "Button text", max: 30 },
      {
        kind: "text",
        name: "successMessage",
        label: "Message after signing up",
        max: 120,
      },
      { kind: "image", name: "image", label: "Decorative photo" },
    ],
  },
  page_hero: {
    label: "Page title",
    description: "The big heading at the top of a page.",
    icon: "H1",
    group: "Page",
    appearance: false,
    defaults: { eyebrow: "", heading: "New page", intro: "" },
    fields: [
      eyebrow,
      {
        kind: "text",
        name: "heading",
        label: "Page heading",
        max: 80,
        required: true,
      },
      { kind: "textarea", name: "intro", label: "Introduction", max: 500 },
      {
        kind: "image",
        name: "image",
        label: "Background photo",
        aspects: () => [
          ["On a computer", 3.2],
          ["On a phone", 1.3],
        ],
      },
    ],
  },
  rich_text: {
    label: "Text",
    description: "Free-form writing with headings, lists and links.",
    icon: "¶",
    group: "Content",
    appearance: true,
    defaults: { body: "<p>Write here…</p>", maxWidth: "narrow", align: "left" },
    fields: [
      { kind: "richtext", name: "body", label: "Text", required: true },
      {
        kind: "select",
        name: "maxWidth",
        label: "Width",
        options: [
          ["narrow", "Narrow (easy to read)"],
          ["wide", "Wide"],
        ],
      },
      {
        kind: "select",
        name: "align",
        label: "Alignment",
        options: [
          ["left", "Left"],
          ["center", "Centered"],
        ],
      },
      ...appearanceFields,
    ],
  },
  quote: {
    label: "Quote",
    description: "A large pull quote.",
    icon: "❝",
    group: "Content",
    appearance: true,
    defaults: { quote: "A memorable line goes here.", attribution: "" },
    fields: [
      {
        kind: "textarea",
        name: "quote",
        label: "Quote",
        max: 400,
        required: true,
      },
      { kind: "text", name: "attribution", label: "Who said it", max: 80 },
      {
        kind: "image",
        name: "portrait",
        label: "Portrait (optional)",
        aspects: () => [["Round portrait", 1]],
      },
      {
        kind: "toggle",
        name: "script",
        label: "Handwritten script style",
        hint: "A flowing handwritten look for short, elegant lines. Best for quotes under about 80 characters.",
      },
      ...appearanceFields,
    ],
  },
  two_column_text: {
    label: "Two columns of text",
    description: "Two blocks of text side by side.",
    icon: "▥",
    group: "Content",
    appearance: true,
    defaults: {
      left: { heading: "", body: "<p>Left column…</p>" },
      right: { heading: "", body: "<p>Right column…</p>" },
    },
    fields: [
      {
        kind: "group",
        name: "left",
        label: "Left column",
        fields: [
          { kind: "text", name: "heading", label: "Heading", max: 60 },
          { kind: "richtext", name: "body", label: "Text", required: true },
        ],
      },
      {
        kind: "group",
        name: "right",
        label: "Right column",
        fields: [
          { kind: "text", name: "heading", label: "Heading", max: 60 },
          { kind: "richtext", name: "body", label: "Text", required: true },
        ],
      },
      ...appearanceFields,
    ],
  },
  cta_banner: {
    label: "Call to action",
    description: "A banner with a heading and buttons.",
    icon: "▬",
    group: "Content",
    appearance: true,
    defaults: {
      heading: "Ready to work together?",
      body: "",
      buttons: [],
      background: "sand",
    },
    fields: [
      {
        kind: "text",
        name: "heading",
        label: "Heading",
        max: 80,
        required: true,
      },
      { kind: "textarea", name: "body", label: "Text", max: 300 },
      buttons,
      ...appearanceFields,
    ],
  },
  image_gallery: {
    label: "Photo gallery",
    description: "A grid of photos that open larger when tapped.",
    icon: "▦",
    group: "Content",
    appearance: true,
    defaults: { items: [], columns: 3, layout: "grid" },
    fields: [
      {
        kind: "repeater",
        name: "items",
        label: "Photos",
        itemLabel: "Photo",
        min: 1,
        max: 40,
        titleField: "caption",
        fields: [
          {
            kind: "image",
            name: "image",
            label: "Photo",
            required: true,
            aspects: () => [["Photo frame", 4 / 3]],
          },
          { kind: "text", name: "caption", label: "Caption", max: 140 },
        ],
      },
      {
        kind: "select",
        name: "columns",
        label: "Columns",
        numeric: true,
        options: [
          ["2", "2"],
          ["3", "3"],
          ["4", "4"],
        ],
      },
      {
        kind: "select",
        name: "layout",
        label: "Layout",
        options: [
          ["grid", "Even grid"],
          ["masonry", "Staggered"],
        ],
      },
      ...appearanceFields,
    ],
  },
  video: {
    label: "Video",
    description: "A YouTube or Vimeo video, or one you upload.",
    icon: "▶",
    group: "Content",
    appearance: true,
    defaults: {},
    fields: [
      { kind: "video", name: "url", label: "Video" },
      { kind: "image", name: "poster", label: "Cover photo (optional)" },
      { kind: "text", name: "caption", label: "Caption", max: 160 },
      ...appearanceFields,
    ],
  },
  stats_row: {
    label: "Numbers",
    description: "Big numbers with short labels.",
    icon: "№",
    group: "Content",
    appearance: true,
    defaults: { items: [{ value: "24+", label: "Years" }] },
    fields: [
      {
        kind: "repeater",
        name: "items",
        label: "Numbers",
        itemLabel: "Number",
        min: 1,
        max: 6,
        titleField: "value",
        fields: [
          {
            kind: "text",
            name: "value",
            label: "Number",
            max: 16,
            required: true,
          },
          {
            kind: "text",
            name: "label",
            label: "Label",
            max: 40,
            required: true,
          },
        ],
      },
      ...appearanceFields,
    ],
  },
  list_feature: {
    label: "List of points",
    description:
      "A heading and a list of short points (facts, topics, offerings).",
    icon: "☰",
    group: "Content",
    appearance: true,
    defaults: {
      heading: "A list",
      items: [{ title: "First point", text: "" }],
      columns: 3,
    },
    fields: [
      eyebrow,
      { kind: "text", name: "heading", label: "Heading", max: 60 },
      { kind: "textarea", name: "intro", label: "Introduction", max: 400 },
      {
        kind: "repeater",
        name: "items",
        label: "Points",
        itemLabel: "Point",
        min: 1,
        max: 24,
        titleField: "title",
        fields: [
          {
            kind: "text",
            name: "title",
            label: "Title",
            max: 120,
            required: true,
          },
          { kind: "textarea", name: "text", label: "Text", max: 300 },
          {
            kind: "select",
            name: "icon",
            label: "Icon",
            options: [
              ["", "None"],
              ["check", "Check"],
              ["star", "Star"],
              ["book", "Book"],
              ["mic", "Microphone"],
              ["stage", "Stage"],
              ["heart", "Heart"],
            ],
          },
        ],
      },
      {
        kind: "select",
        name: "columns",
        label: "Columns",
        numeric: true,
        options: [
          ["1", "1"],
          ["2", "2"],
          ["3", "3"],
        ],
      },
      ...appearanceFields,
    ],
  },
  testimonials: {
    label: "Testimonials",
    description: "Approved testimonials. Hidden until some exist.",
    icon: "❞",
    group: "Pulls from the site",
    appearance: true,
    defaults: { heading: "Kind words", layout: "grid" },
    fields: [
      eyebrow,
      { kind: "text", name: "heading", label: "Heading", max: 60 },
      {
        kind: "select",
        name: "context",
        label: "Show testimonials about",
        options: [
          ["", "Everything"],
          ["speaking", "Speaking"],
          ["book", "Books"],
        ],
      },
      {
        kind: "select",
        name: "layout",
        label: "Layout",
        options: [
          ["grid", "Grid"],
          ["carousel", "Slideshow"],
        ],
      },
      ...appearanceFields,
    ],
  },
  logo_strip: {
    label: "Logos",
    description: "A row of partner or press logos.",
    icon: "◎",
    group: "Content",
    appearance: true,
    defaults: { heading: "", items: [{ name: "Partner" }] },
    fields: [
      { kind: "text", name: "heading", label: "Heading", max: 60 },
      {
        kind: "repeater",
        name: "items",
        label: "Logos",
        itemLabel: "Logo",
        min: 1,
        max: 12,
        titleField: "name",
        fields: [
          {
            kind: "text",
            name: "name",
            label: "Name",
            max: 60,
            required: true,
          },
          { kind: "text", name: "href", label: "Link (optional)", link: true },
          { kind: "image", name: "image", label: "Logo image (optional)" },
        ],
      },
      ...appearanceFields,
    ],
  },
  faq: {
    label: "Questions and answers",
    description: "An accordion of frequently asked questions.",
    icon: "?",
    group: "Content",
    appearance: true,
    defaults: {
      heading: "Frequently asked questions",
      items: [{ question: "A question?", answer: "<p>The answer.</p>" }],
    },
    fields: [
      eyebrow,
      { kind: "text", name: "heading", label: "Heading", max: 60 },
      {
        kind: "repeater",
        name: "items",
        label: "Questions",
        itemLabel: "Question",
        min: 1,
        max: 30,
        titleField: "question",
        fields: [
          {
            kind: "text",
            name: "question",
            label: "Question",
            max: 200,
            required: true,
          },
          { kind: "richtext", name: "answer", label: "Answer", required: true },
        ],
      },
      ...appearanceFields,
    ],
  },
  credits_list: {
    label: "Film and theater credits",
    description:
      "Credits grouped by stage and screen, with roles and watch links.",
    icon: "🎬",
    group: "Pulls from the site",
    appearance: true,
    defaults: { heading: "Credits", featuredOnly: false },
    fields: [
      eyebrow,
      { kind: "text", name: "heading", label: "Heading", max: 60 },
      {
        kind: "select",
        name: "category",
        label: "Show",
        options: [
          ["", "All credits"],
          ["stage", "Stage plays only"],
          ["film", "Film only"],
          ["tv", "TV only"],
          ["other", "Other only"],
        ],
      },
      {
        kind: "toggle",
        name: "featuredOnly",
        label: "Only credits marked Featured",
      },
      ...appearanceFields,
    ],
  },
  book_grid: {
    label: "Books",
    description: "All published books with their cover and status.",
    icon: "📚",
    group: "Pulls from the site",
    appearance: true,
    defaults: {},
    fields: [
      {
        kind: "select",
        name: "status",
        label: "Show",
        options: [
          ["", "All books"],
          ["available", "Available now"],
          ["coming_soon", "Coming soon"],
        ],
      },
      ...appearanceFields,
    ],
  },
  event_list: {
    label: "Events list",
    description: "Upcoming and/or past events.",
    icon: "📅",
    group: "Pulls from the site",
    appearance: true,
    defaults: {
      scope: "both",
      emptyText:
        "New dates are on the way. Join the mailing list to hear first.",
      emptyLinkLabel: "Book Tangie for your event",
      emptyLinkHref: "/speaking#inquiry",
    },
    fields: [
      {
        kind: "select",
        name: "scope",
        label: "Show",
        options: [
          ["both", "Upcoming and past"],
          ["upcoming", "Upcoming only"],
          ["past", "Past only"],
        ],
      },
      {
        kind: "textarea",
        name: "emptyText",
        label: "Text when there are no upcoming events",
        max: 200,
      },
      { kind: "text", name: "emptyLinkLabel", label: "Link text", max: 60 },
      {
        kind: "text",
        name: "emptyLinkHref",
        label: "Link address",
        link: true,
      },
      ...appearanceFields,
    ],
  },
  post_grid: {
    label: "Journal posts (grid)",
    description: "All journal posts with category filters and pages.",
    icon: "▦",
    group: "Pulls from the site",
    appearance: true,
    defaults: { perPage: 9 },
    fields: [
      {
        kind: "number",
        name: "perPage",
        label: "Posts per page",
        min: 3,
        max: 24,
      },
      ...appearanceFields,
    ],
  },
  contact_form: {
    label: "Contact form",
    description: "General enquiry form.",
    icon: "✎",
    group: "Forms",
    appearance: true,
    defaults: { heading: "Get in touch", intro: "" },
    fields: [
      eyebrow,
      { kind: "text", name: "heading", label: "Heading", max: 60 },
      { kind: "textarea", name: "intro", label: "Introduction", max: 400 },
      {
        kind: "select",
        name: "presetType",
        label: "Pre-selected enquiry type",
        options: [
          ["", "None"],
          ["General", "General"],
          ["Booking / Speaking", "Booking / Speaking"],
          ["Media / Press", "Media / Press"],
          ["Books / Book Club", "Books / Book Club"],
          ["Collaboration", "Collaboration"],
        ],
      },
      ...appearanceFields,
    ],
  },
  booking_form: {
    label: "Speaking booking form",
    description: "Request Tangie for an event.",
    icon: "🎤",
    group: "Forms",
    appearance: true,
    defaults: {
      eyebrow: "Book Tangie",
      heading: "Request Tangie for your event",
      intro: "",
    },
    fields: [
      eyebrow,
      { kind: "text", name: "heading", label: "Heading", max: 60 },
      { kind: "textarea", name: "intro", label: "Introduction", max: 400 },
      ...appearanceFields,
    ],
  },
  downloads: {
    label: "Downloads",
    description: "Files to download (press kit, headshots).",
    icon: "⬇",
    group: "Content",
    appearance: true,
    defaults: { heading: "Downloads", items: [] },
    fields: [
      eyebrow,
      { kind: "text", name: "heading", label: "Heading", max: 60 },
      {
        kind: "repeater",
        name: "items",
        label: "Files",
        itemLabel: "File",
        min: 1,
        max: 24,
        titleField: "label",
        fields: [
          {
            kind: "text",
            name: "label",
            label: "Name",
            max: 80,
            required: true,
          },
          {
            kind: "text",
            name: "description",
            label: "Short description",
            max: 160,
          },
          { kind: "downloadFile", name: "file", label: "File (PDF or ZIP)" },
        ],
      },
      ...appearanceFields,
    ],
  },
  embed: {
    label: "Embed",
    description:
      "An embedded page from YouTube, Vimeo, Eventbrite, Spotify or Google Maps.",
    icon: "⧉",
    group: "Content",
    appearance: true,
    defaults: { title: "Embedded content", height: 480 },
    fields: [
      {
        kind: "text",
        name: "url",
        label: "Address (https://…)",
        required: true,
        hint: "Only YouTube, Vimeo, Eventbrite, Spotify and Google Maps are allowed.",
      },
      {
        kind: "text",
        name: "title",
        label: "Description for screen readers",
        max: 120,
        required: true,
      },
      {
        kind: "number",
        name: "height",
        label: "Height (pixels)",
        min: 200,
        max: 900,
      },
      ...appearanceFields,
    ],
  },
  spacer_divider: {
    label: "Space / divider",
    description: "Extra space with an optional thin line.",
    icon: "―",
    group: "Content",
    appearance: false,
    defaults: { size: "medium", rule: false },
    fields: [
      {
        kind: "select",
        name: "size",
        label: "Size",
        options: [
          ["small", "Small"],
          ["medium", "Medium"],
          ["large", "Large"],
        ],
      },
      { kind: "toggle", name: "rule", label: "Show a thin line" },
    ],
  },
};

export function sectionLabelFor(
  type: string,
  props: Record<string, unknown>,
): string {
  const meta = SECTION_META[type];
  const pick = (k: string) => {
    const v = props[k];
    return typeof v === "string" && v.trim() ? v.trim() : "";
  };
  const text =
    pick("heading") ||
    pick("titleLine1") ||
    pick("quote") ||
    pick("title") ||
    (typeof props.left === "object" && props.left
      ? String((props.left as Record<string, unknown>).heading ?? "")
      : "");
  const clean = text.replace(/<[^>]+>/g, "").slice(0, 48);
  return clean || meta?.label || type;
}
