# CLAUDE.md — TangieBeaty.com Rebuild

**Client:** Tangie Brickhouse-Beaty (author, playwright, director, producer — WOW Studio One / Destined 2 WOW Foundation)
**Agency:** R.O. Media Studios
**Goal:** Replace the current Wix site with a custom site that matches the approved homepage mockup **pixel-for-pixel in layout, spacing, type and color**, plus an admin back end with a **section-based page builder**: Tangie can edit any text, image or button on any page, add new sections, reorder, hide, duplicate or delete them, and create brand-new pages, all without a developer. She also manages books, events, journal posts and credits from the same admin.

> **Core principle:** the mockup is the *default arrangement* of building blocks, not a hard-coded page. Every homepage section in §3 is a reusable **section type** (§6B). The homepage is seeded with those sections in mockup order, so on day one it looks exactly like the mockup, and afterwards Tangie can change anything.

Read this whole file before writing code. Work **one milestone at a time**. At the end of each milestone: run `npm run build`, fix every error, commit, push to `main` (Railway auto-deploys), and report what changed and what's next. Always give complete files, never partial snippets.

Companion file: **`SITE_CONTENT.md`** — verbatim content and image URLs scraped from the live Wix site on 2026-10-13. Use it for all seed data. Do not invent content.

---

## 1. Stack

### Version policy (read first)
- **Before M1 and before every milestone that adds a dependency, run `npm view <pkg> version` (and `dist-tags`) and use the current stable release.** The versions below were verified on **2026-10-13**; if npm shows a newer stable release, use it, and note the change in your milestone report.
- Never use `beta`, `rc`, `canary` or `next` tags. Never downgrade below the versions listed.
- Check peer dependencies before installing (`npm view <pkg> peerDependencies`). If the newest major of one package breaks a peer (see TypeScript below), stay on the newest version that's compatible and say why.
- Scaffold with `npx create-next-app@latest` (Next.js 16.4+ enables Cache Components by default for new apps). Then run `npx @next/codemod@latest agents-md` so Claude Code reads the docs bundled with the installed Next.js version in `node_modules/next/dist/docs/` instead of relying on memory.
- Pin exact versions in `package.json` (no `^`), commit `package-lock.json`, and set `"engines": { "node": ">=22" }`.

| Layer | Choice | Version (verified 2026-10-13) |
|---|---|---|
| Runtime | Node.js **22 LTS** (security support to Apr 2027). Set Railway `NIXPACKS_NODE_VERSION=22` or an `.nvmrc`. | 22.x |
| Framework | **Next.js 16.4** (App Router, TypeScript, Turbopack default) with **Cache Components** on | `next` 16.4.0 |
| UI library | React | `react` / `react-dom` 19.3.0 |
| Language | TypeScript **6.0.x** — **not 7.x**: `typescript-eslint` (used by `eslint-config-next`) only supports `<6.1.0` | `typescript` 6.0.3 |
| Lint | ESLint flat config (`next lint` was removed in Next 16; run `eslint .` directly) | `eslint` 10.x, `eslint-config-next` 16.4.0 |
| Styling | Tailwind CSS **v4** (CSS-first `@theme` config, no `tailwind.config.js`) + `@tailwindcss/typography` for journal prose | `tailwindcss` 4.3.3 |
| Fonts | `next/font/google`: **Newsreader** (variable, `opsz` axis, regular + italic) for display; **DM Sans** (400, 500, 600) for UI/body | — |
| DB | Postgres (Railway or Neon) via **Drizzle ORM** — use the stable 0.45 line; Drizzle 1.0 is still RC, don't use it | `drizzle-orm` 0.45.4, `drizzle-kit` 0.31.11, `postgres` 3.4.9 |
| Validation | Zod **4** (`import { z } from 'zod'`) | `zod` 4.6.7 |
| Images & files | The **Railway Storage Bucket** (S3-compatible, private) is the **only** home for every image, video and download. `sharp` processes uploads; presigned PUT URLs for large files; `next/image` renders. Because the bucket has no public URL, the app serves files itself from a same-origin route `/media/<key>` (streams from the bucket with `Cache-Control: public, max-age=31536000, immutable`; keys contain a uuid so they never change). | `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` 3.1151.0, `sharp` 0.35.5, `file-type` 22.1.1 |
| Email | Resend (transactional: inquiry notifications + auto-reply) | `resend` 6.32.1 |
| Newsletter | Store subscribers in DB **and** sync to Brevo list via API (double opt-in through Brevo) | `@getbrevo/brevo` 6.1.0 |
| Auth (admin only) | Custom: bcryptjs + jose (JWT in httpOnly cookie) + zod. Single admin role. | `bcryptjs` 3.0.3, `jose` 6.2.12 |
| Spam | Cloudflare Turnstile on every public form + honeypot field | `@marsidev/react-turnstile` 1.6.2 |
| Rich text | **TipTap v3** editor in admin; store HTML (sanitize with `sanitize-html` on save) | `@tiptap/react` + `@tiptap/starter-kit` 3.32.0, `sanitize-html` 2.18.0 |
| Drag & drop | `@dnd-kit/core` + `@dnd-kit/sortable` (stable, touch support). Don't use `@dnd-kit/react` yet; it's still pre-1.0 (0.5.0). | `@dnd-kit/core` 6.3.1, `@dnd-kit/sortable` 10.0.0 |
| Page builder | Custom (§6B): zod section schemas → auto-generated forms, iframe live preview | — |
| Analytics | Plausible (or GA4 if client prefers) with custom events | — |
| Hosting | Railway, auto-deploy from `main` | — |

### Next.js 16 rules (these differ from Next 15; follow them exactly)
- **`proxy.ts`, not `middleware.ts`.** Next 16 renamed middleware to proxy; export `function proxy(request)`. It runs on Node.js (no edge runtime). Use it for admin auth checks and the `redirects` table lookup.
- **Cache Components on** in `next.config.ts`: `cacheComponents: true` and `partialPrefetching: true`. All public reads of pages, sections, books, events, posts, nav and settings go through functions marked `'use cache'` with `cacheLife('max')` and a `cacheTag(...)` (e.g. `page:${slug}`, `nav`, `settings`, `posts`, `events`, `books`).
- **Invalidate with `updateTag()` inside Server Actions** (read-your-writes, so Tangie sees her change immediately after Publish). `revalidateTag` now requires a second argument (`revalidateTag('posts', 'max')`); prefer `updateTag` for admin saves. Don't use `revalidatePath`.
- **Upcoming-events data** depends on today's date: cache it with `cacheLife('hours')` so past events drop off automatically, not `'max'`.
- **Request APIs are async only:** `await params`, `await searchParams`, `await cookies()`, `await headers()`, `await draftMode()`. Use the generated `PageProps<'/route'>` / `LayoutProps` types (`npx next typegen`).
- **Admin and preview routes are dynamic** (they read cookies). Wrap their dynamic parts in `<Suspense>` as Cache Components requires. Public `(site)` layout: `export const ensureStatic = 'shell'` so a dynamic component can't sneak into public pages unnoticed.
- **`next/image`:** use `images.localPatterns` for `/media/**` (media is served same-origin from the bucket). Do not add any remote hosts and never add `static.wixstatic.com` (see §5B). Default `qualities` is now `[75]` only; add `[75, 90]` if the hero needs 90.
- Smooth scroll: if `scroll-behavior: smooth` is set globally, add `data-scroll-behavior="smooth"` to `<html>`.
- Optional, off by default: `reactCompiler: true` (only if build times stay acceptable).

### Environment variables
```
DATABASE_URL=                 # Railway Postgres (reference variable)
REDIS_URL=                    # Railway Redis (reference variable): login rate limiting
JWT_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=          # bcrypt hash, used by seed to create first admin
BUCKET_NAME=                  # Railway bucket variables, exactly as Railway names them
BUCKET_ENDPOINT=
BUCKET_REGION=
BUCKET_ACCESS_KEY_ID=
BUCKET_SECRET_ACCESS_KEY=
RESEND_API_KEY=
INQUIRY_TO_EMAIL=tangiebeaty@gmail.com
INQUIRY_FROM_EMAIL=            # e.g. hello@tangiebeaty.com (verify domain in Resend)
BREVO_API_KEY=
BREVO_LIST_ID=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
NEXT_PUBLIC_SITE_URL=https://www.tangiebeaty.com
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=tangiebeaty.com
BOOK_PURCHASE_URL=             # Stripe Payment Link or retailer URL (see Open Questions)
```

---

## 2. Design system (extracted from the mockup)

### Colors — define as CSS variables in `app/globals.css` and map into Tailwind theme
| Token | Hex | Used for |
|---|---|---|
| `--ivory` | `#F7F4EE` | Page background, header |
| `--ivory-deep` | `#EFEAE2` | Event cards, subtle panels |
| `--sand` | `#E6DCCD` | Featured Book band, newsletter band |
| `--white` | `#FFFFFF` | Inputs, cards |
| `--charcoal` | `#252522` | Headings, body text on light |
| `--ink` | `#1C1A18` | Film & Theater band, footer background |
| `--stone` | `#6B665E` | Secondary text (role line, dates, locations) |
| `--bronze` | `#8C6B3F` | **Filled buttons**, eyebrow labels, arrow links, date-tile month |
| `--bronze-light` | `#B89A72` | Outline-button borders, dividers, eyebrow on dark bg |
| `--line` | `#D9D0C3` | Hairlines, input borders |

### Typography

> **M2 calibration note (read before touching type or spacing).** The mockup's display face is closest to **Newsreader**, not Cormorant Garamond, and its real sizes are larger than the table below. In M2 every size and spacing value was measured from `design/homepage-mockup.png` (scaled to 1440px wide) and the page was matched to it. The values in the table below are the original estimates; the **truth is in `app/globals.css`** (`--text-*` tokens) and the section components. Desktop layout is written in a design unit: `calc(var(--u) * N)` where N is px at 1440 and `--u` is 1px at 1440+ and shrinks proportionally below. Do not hand-tune a size without re-measuring against the mockup.

| Style | Font | Size desktop / mobile | Notes |
|---|---|---|---|
| Hero name line 1 ("TANGIE") | Newsreader 500 | 88px / 52px | uppercase, line-height 0.95, letter-spacing 0.01em |
| Hero name line 2 ("BRICKHOUSE-BEATY") | Newsreader 500 | 44px / 28px | uppercase |
| H2 section titles | Newsreader 500 | 40px / 30px | Sentence case. "Justified Lies" uses **500 italic** |
| Card titles (events, journal) | Newsreader 600 | 20px / 19px | |
| Eyebrow labels | DM Sans 600 | 11px | uppercase, letter-spacing 0.18em, color `--bronze` |
| Role line ("AUTHOR \| PLAYWRIGHT…") | DM Sans 500 | 12px | uppercase, letter-spacing 0.22em, `--stone`, separators are thin `\|` with 12px spacing |
| Body | DM Sans 400 | 16px / 15px | line-height 1.65, max-width 34rem |
| Buttons | DM Sans 600 | 11px | uppercase, letter-spacing 0.16em |
| Arrow links ("VIEW ALL EVENTS →") | DM Sans 600 | 10.5px | uppercase, letter-spacing 0.16em, `--bronze`, arrow shifts 3px right on hover |
| Logo wordmark | "TANGIE" Cormorant 500 26px, tracking 0.04em; "BRICKHOUSE-BEATY" Cormorant 500 11px tracking 0.28em, stacked | | Same wordmark ivory in footer |

### Components
- **Button / filled:** bg `--bronze`, text white, padding 14px 26px, radius 0 (square corners), hover: darken 8%.
- **Button / outline:** 1px border `--bronze-light`, text `--charcoal`, transparent bg, hover: bg `--bronze`, text white.
- **Header CONTACT button:** filled button, smaller (padding 11px 22px).
- **Eyebrow + H2 pair:** eyebrow 12px above H2.
- **Section padding:** 96px vertical desktop, 64px mobile. Content max-width 1200px, 24px side gutter (16px on phones).
- **Date tile:** 64×64, bg `--ivory`, month abbr (DM Sans 600 13px uppercase `--bronze`) over day number (Cormorant 600 30px `--bronze`).
- Square corners everywhere. No drop shadows. Transitions 200ms ease. Respect `prefers-reduced-motion`.

---

## 3. Homepage — section-by-section spec (match the mockup exactly)

1. **Header** (sticky, bg `--ivory`, 80px tall, hairline bottom border on scroll)
   - Left: stacked wordmark. Center: nav — Home · Books · Film & Theater · Speaking · Events · Journal · About (DM Sans 500, 13px, `--charcoal`, active item gets 1px bronze underline). Right: **CONTACT** filled button.
   - Mobile (<1024px): wordmark + hamburger → full-screen ivory overlay menu with large Cormorant links and CONTACT button at bottom.

2. **Hero** (two columns ~50/50, min-height 560px, bg `--ivory` with very soft warm gradient)
   - Left: "TANGIE" / "BRICKHOUSE-BEATY" / role line "AUTHOR | PLAYWRIGHT | DIRECTOR | PRODUCER" / paragraph: *"Tangie Brickhouse-Beaty is an author, playwright, director, and producer whose work spans books, stage, and screen."* / buttons **EXPLORE THE BOOK** (filled → `/books/justified-lies`) and **SPEAKING & BOOKINGS** (outline → `/speaking`).
   - Right: portrait, bleeds to right viewport edge and to bottom of section, `object-position: top`. Priority-loaded.
   - Mobile: portrait on top (4:5), text below.

3. **Featured Book** (full-width band bg `--sand`)
   - Left half: lifestyle photo of the book on a marble surface with plant (image bleeds to left edge).
   - Right: eyebrow FEATURED BOOK / H2 italic *Justified Lies* / short synopsis (pull from Book record `shortBlurb`) / **LEARN MORE** (filled → book page) + **BUY THE BOOK** (outline → purchase URL, opens new tab, fires `book_purchase_click`).

4. **Meet Tangie** (bg `--ivory`)
   - Left: portrait in a contained frame (~4:3.5), not full-bleed. Right: eyebrow MEET TANGIE / H2 "Author. Playwright.<br>Director. Producer." / paragraph / **ABOUT TANGIE** filled → `/about`.

5. **Film & Theater** (bg `--ink`, text ivory)
   - Left: eyebrow (`--bronze-light`) FILM & THEATER / H2 "Stories Beyond the Page" / paragraph mentioning *Secrets in Plain Sight* in italics / **EXPLORE FILM & THEATER** filled.
   - Right: stage photo with a left-to-right gradient from `--ink` (opacity 1 → 0) so it melts into the dark band.

6. **Speaking** (bg `--ivory`)
   - Left: speaking photo, full-bleed to left edge, same height as section. Right: eyebrow SPEAKING / H2 "Engage. Inspire. Connect." / paragraph / **BOOK TANGIE** filled → `/speaking#inquiry`.

7. **Upcoming Events** (bg `--ivory`)
   - Row: eyebrow UPCOMING EVENTS + H2 "Where to See Tangie" left; "VIEW ALL EVENTS →" right.
   - 3-column grid of event cards (bg `--ivory-deep`, padding 20px): date tile left; title, city/state (or "Virtual Event"), "VIEW DETAILS →".
   - Data: next 3 **published, future** events ordered by date. **Empty state** (current reality — no future events exist): single wide card reading "New dates are on the way. Join the mailing list to hear first." with a "BOOK TANGIE FOR YOUR EVENT →" link. Never show the mockup's placeholder events.

8. **From the Journal** (bg `--ivory`)
   - eyebrow FROM THE JOURNAL / H2 "Latest Reflections" / "VIEW ALL POSTS →".
   - 3 cards: image (16:9, cover), title (Cormorant 600, 2-line clamp), date (DM Sans 12px `--stone`), "READ MORE →". Data: 3 latest published posts.

9. **Newsletter** (band bg `--sand`, decorative books-and-plant image on left half fading into sand)
   - eyebrow STAY CONNECTED / H2 "Join the Mailing List" / "Be the first to hear about new books, events, and updates." / inline form: email input (white, 48px tall) + **SUBSCRIBE** filled button. Success and error states inline. Turnstile invisible mode.

10. **Footer** (bg `--ink`)
    - Left: ivory wordmark + social icons row (Facebook, Instagram, YouTube, TikTok, LinkedIn — plus X if client wants it kept; see Open Questions). Icons 18px, ivory 80% opacity, hover bronze-light.
    - Right: footer nav Home · Books · Film & Theater · Speaking · Events · Journal · About · Contact.
    - Bottom row: "© {currentYear} Tangie Brickhouse-Beaty. All rights reserved." · Privacy Policy | Terms. Add small "WOW Studio One" and "Destined 2 WOW Foundation" text links (they exist on the current site).

> **Images:** every image slot is a field on its section and can be replaced by uploading a new photo in the page builder. Launch images come from `seed-assets/` (§5B): the mockup's original image files first, then the migrated Wix images. Nothing is ever loaded from Wix.
>
> **Header and footer** are global, not page sections. They're edited in Admin → Site Settings → Navigation and Footer (`nav_items` + `site_settings`).

---

## 4. Sitemap & inner pages

All inner pages reuse the header/footer and design tokens. Each begins with a **page hero**: eyebrow + H1 (Cormorant 56px) + intro paragraph, bg `--ivory`, 120px top padding.

| Route | Content |
|---|---|
| `/` | Homepage above |
| `/books` | Series intro ("My stories live at the intersection of secrets, survival, faith, and family…"), book grid (cover, title, series position, status badge: Available / Coming Soon) |
| `/books/[slug]` | Two-column: cover left; title, tagline ("The Lie That Started It All!"), full synopsis, series info, BUY button(s) for each retailer link, reviews section (hidden until reviews exist), "Book club inquiry" CTA → contact form with type preset |
| `/film-theater` | Intro, credits list grouped by category (Stage Plays / Film & TV) with role tags (Writer, Director, Producer, Casting), featured *Secrets in Plain Sight* block with streaming buttons (Tubi, Peacock), photo/video gallery, awards & press |
| `/speaking` | Intro, topics grid (5 topics from current site), photo strip, testimonials (hidden until approved ones exist), **booking inquiry form** `#inquiry` |
| `/events` | Upcoming events list + "Past Events" archive below (collapsed recaps with photos) |
| `/events/[slug]` | Image, date/time, venue + address (link to Google Maps), description, registration link if any, share buttons, Event JSON-LD |
| `/journal` | Category filter chips (Faith & Leadership, Behind the Scenes, Creative Business, Life Lessons, Writing & Storytelling), post grid, pagination (9/page) |
| `/journal/[slug]` | Hero image, title, date, reading time, category, body (prose styles in Cormorant/DM Sans), signature block, share links, 3 related posts, newsletter band |
| `/about` | Long bio, signature quote, Quick Facts list, photos, links to WOW Studio One & Destined 2 WOW Foundation |
| `/contact` | General inquiry form with Inquiry Type select (General, Booking/Speaking, Media/Press, Books/Book Club, Collaboration), phone & email if client approves |
| `/press` | Short + long bio, downloadable headshots & cover art (zip or individual), verified credits, media contact |
| `/privacy`, `/terms` | Editable text pages |
| `/[slug]` | **Any page Tangie creates** in the page builder (e.g. `/workshops`, `/tour`, `/media`). Catch-all route renders from `pages` + `sections`; 404 if not published. |
| `/admin/*` | CMS (see §6 and §6B) |

**Every page above is built from sections.** Listing/detail pages (`/books`, `/events`, `/journal`, `/books/[slug]`, etc.) are seeded with a page record whose section stack includes a data section (e.g. `book_grid`, `event_list`, `post_grid`) that pulls live records. Tangie can add text, images, quotes or CTAs above or below those data sections. Detail templates (`/books/[slug]`, `/events/[slug]`, `/journal/[slug]`) render the record first, then an editable "below the content" section stack shared by all items of that type.

### Redirects (in `next.config.ts`, all **301**)
```
/upcoming-events        → /events
/blog                   → /journal
/post/:slug             → /journal/:newslug   (map the 3 posts explicitly — see SITE_CONTENT.md)
/book-tangie            → /contact
/product-page-1         → /books
/events/:slug           → /events/:slug       (keep same slugs)
```

---

## 5. Database schema (Drizzle)

```
admins            id, email (unique), password_hash, created_at
books             id, slug, title, subtitle, tagline, series_name, series_order, status (available|coming_soon),
                  short_blurb, synopsis_html, cover_media_id → media, lifestyle_media_id → media, published (bool), sort_order, created_at, updated_at
book_links        id, book_id → books, label (e.g. "Buy Signed Copy", "Amazon"), url, sort_order
events            id, slug, title, starts_at (timestamptz), ends_at, timezone (default America/New_York),
                  venue_name, address, city, state, is_virtual (bool), description_html, image_media_id → media, gallery_media_ids (uuid[]),
                  registration_url, recap_html, published, created_at, updated_at
posts             id, slug, title, excerpt, body_html, cover_media_id → media, category, author_name (default "Tangie Brickhouse-Beaty"),
                  published_at, status (draft|published), seo_title, seo_description, legacy_wix_slug, created_at, updated_at
credits           id, title, category (stage|film_tv|other), roles (text[]), year, description, image_media_id → media,
                  watch_links (jsonb: [{label,url}]), featured (bool), sort_order
testimonials      id, quote, name, org, portrait_media_id → media (nullable), context (speaking|book), approved (bool), sort_order
speaking_topics   id, title, description, sort_order
inquiries         id, type, first_name, last_name, email, phone, organization, event_date, event_location,
                  audience, attendance, budget, message, status (new|read|archived), created_at
subscribers       id, email (unique), source, brevo_synced (bool), created_at
media             id, kind (image|video|document), r2_key, url, original_r2_key, original_filename, mime_type,
                  size_bytes, width, height, alt, caption, focal_x, focal_y (0–1, default 0.5), blur_data_url,
                  source (upload|wix_migration|mockup), legacy_url (the old Wix URL, for audit only — never rendered),
                  uploaded_by → admins, created_at, updated_at
media_usage       id, media_id → media, entity_type (section|book|event|post|credit|testimonial|settings|page), entity_id,
                  field_path   -- rebuilt on every save; powers "Used on" and blocks deleting in-use files
site_settings     key (pk), value (jsonb)   — wordmark text, social links, contact info, footer text, default SEO, announcement bar

-- PAGE BUILDER (see §6B)
pages             id, slug (unique; "" = homepage), title, seo_title, seo_description, og_media_id → media,
                  status (draft|published), is_system (bool — Home, Books, Events, Journal, etc. can't be deleted or re-slugged),
                  template (standard|book_detail|event_detail|post_detail), created_at, updated_at, published_at
sections          id, page_id → pages (on delete cascade), type (text — key in the section registry),
                  props (jsonb — LIVE content), draft_props (jsonb, nullable — unpublished edits),
                  sort_order (int), hidden (bool), anchor_id (text, nullable — e.g. "inquiry" for /speaking#inquiry),
                  is_draft_new (bool — added but not yet published), is_draft_deleted (bool — removed but not yet published),
                  created_at, updated_at
page_revisions    id, page_id → pages, snapshot (jsonb — full ordered section array at publish time),
                  note (text), published_by → admins, created_at      -- keep the latest 25 per page
section_templates id, name, type, props (jsonb), created_at           -- "Save as reusable block" for Tangie's own presets
nav_items         id, location (header|footer), label, href, page_id (nullable → pages), sort_order, is_button (bool)
redirects         id, from_path (unique), to_path, status_code (default 301), created_at   -- auto-created on slug change / page delete
```

**Rule:** no public page layout is hard-coded. Every page, including the homepage, renders from `pages` + `sections`.

**Image references:** every image column above (`*_media_id`) and every image field in section props stores a **`media.id`**, never a typed-in URL. Resolve to the R2 URL when reading (join `media`, or a cached `{ id, url, alt, width, height, focal, blur }` object inside section props, refreshed on Replace file).

---

## 5B. Content & image migration — MIGRATE, never reference

The Wix site is **cancelled after launch**. Every Wix URL (`static.wixstatic.com`, `tangiebeaty.com/_paylink/...`, Wix blog/event URLs) will stop working. This build **copies** everything it needs into our own database and R2 bucket. The new site must work identically the day Wix is switched off.

### Rules
1. **No runtime dependency on Wix.** No `wixstatic.com` in code, config, DB rows (except the `media.legacy_url` audit column), `next/image` remotePatterns, or rendered HTML.
2. **Text content** is already captured in `SITE_CONTENT.md` and goes into Postgres through the seed. Wix is never queried.
3. **Images** are downloaded **once**, committed to the repo as a permanent backup under `seed-assets/`, then uploaded to the bucket by the seed.
4. **Automated guard:** `scripts/check-no-wix.ts` searches the codebase (excluding `SITE_CONTENT.md`, `seed-assets/manifest.json` and the script itself) and every text/jsonb column in the DB (excluding `media.legacy_url`) for `wixstatic` or `tangiebeaty.com/_`. Wire it into `npm run build` as a `prebuild` step once M3 is done; the build **fails** if anything is found.

### `seed-assets/` folder
```
seed-assets/
  wix/          ← originals downloaded from Wix (full resolution, no Wix resizing)
  mockup/       ← original image files used to make the homepage mockup (Shayne supplies these)
  manifest.json ← one entry per image slot
```
`manifest.json` entry: `{ "slot": "home.hero.image", "file": "mockup/hero-portrait.jpg", "fallback": "wix/790a13_99bf0b91.jpeg", "alt": "Tangie Brickhouse-Beaty, smiling, in a black blouse", "focal": [0.5, 0.2], "legacy_url": "https://static.wixstatic.com/media/…" }`

**Priority per slot:** `mockup/` file if present → `wix/` file → skip and log `TODO(client): missing image for <slot>`.

**Mockup images:** the mockup is one flattened PNG, so its photos can't be cut out at usable quality. Use the **original image files** Shayne used to build it (hero portrait, book lifestyle shot, Meet Tangie portrait, stage, speaking photo, journal thumbnails, books-and-plant newsletter image). If a slot has no original yet, fall back to the Wix image and flag it in the milestone report.

### Download step (`scripts/download-wix-assets.ts`, run in M1)
- For every URL in the `SITE_CONTENT.md` image inventory, request the **original** file: strip everything from `/v1/` onward (e.g. `…~mv2.jpeg`, not `…~mv2.jpeg/v1/fill/w_317…`).
- Save to `seed-assets/wix/<wix-media-id>.<ext>`; verify it decodes with `sharp` and record width/height in the manifest.
- Also download: the Justified Lies poster, the social share image, the white logo PNG (press kit), and the launch-video poster. Ask the client for the original launch **video** file (Wix only exposes a stream).
- Skip the Wix **stock** images (`11062b_…`, `056e2cc0…`): they're licensed only for use on Wix. Leave those slots for replacement and flag them.
- Run it **in M1**, before anything else, so the backup exists even if Wix goes away early. Commit `seed-assets/`.

### Seed upload step (M3)
- For each manifest slot: process the file through the same pipeline as admin uploads (§6C), upload to the bucket, insert a `media` row (`source` = `mockup` or `wix_migration`, `legacy_url` kept for audit), and wire the `media.id` into the right book/event/post/section prop.
- Idempotent: re-running the seed doesn't duplicate media (match on `legacy_url` or file hash).

### Before Wix is cancelled (M9 checklist)
- `check-no-wix` passes on the production DB.
- Load every public page with DevTools open: **zero** requests to `wixstatic.com`.
- Export from the Wix dashboard as an archive: Contacts, Forms submissions, and any Wix Stores/Pay orders (keep as CSV backups; only import contacts as newsletter subscribers if they opted in).
- Domain: if Wix is the registrar, **transfer the domain out first**, or the domain goes with the Wix plan.
- Book sales: replace the Wix paylink with the new purchase link (Stripe Payment Link or retailer URLs) and test a purchase.

---

## 6. Admin CMS (`/admin`)

- `/admin/login` — email + password; rate-limit 5 attempts / 15 min per IP.
- `proxy.ts` does a fast cookie-presence check for `/admin/*` and `/api/admin/*` and redirects to login; **every admin Server Action and route handler also verifies the jose JWT itself** (never rely on the proxy alone).
- Sidebar: Dashboard · **Pages** · Books · Events · Journal · Film & Theater · Speaking Topics · Testimonials · Inquiries · Subscribers · Media Library · Navigation · Site Settings.
- **Dashboard:** counts of new inquiries, subscribers this month, next event, latest post.
- **CRUD screens** for every table with list, create, edit, delete (confirm modal), publish toggle.
- **Uploads:** Tangie can upload images (and video and documents) **anywhere** an image or file is used. Full spec in §6C.
- **Journal editor:** TipTap with headings, bold/italic, lists, blockquote, links, images. Slug auto-generated, editable. Preview button.
- **Inquiries:** table with filter by type/status, detail drawer, mark read/archived, "Reply" = `mailto:` link.
- **Subscribers:** list + CSV export.
- **Navigation:** drag-to-reorder header and footer links; pick a page from a dropdown or enter a URL; toggle which item is the CONTACT-style button.
- **Site Settings:** wordmark text, contact info, social links, footer copyright line, default SEO image, optional announcement bar (text + link + on/off).
- Admin UI uses the same fonts/colors but plain, functional layouts. Mobile-usable so Tangie can post from her phone.

---

## 6C. Uploads & Media Library

### Where Tangie can upload
- **Every `image` field** in every section, plus book covers and lifestyle shots, event images, journal covers **and images inside journal posts** (TipTap image button), credit photos, testimonial portraits, and the default social share image.
- Each image field shows two buttons: **Upload new** (opens the file picker or camera on a phone) and **Choose from library**. Drag-and-drop onto the field also works on desktop.
- **Gallery** sections and the Media Library accept **multiple files at once** (multi-select, drag a folder of photos).
- **Video** (`video` section): upload an MP4/MOV, or paste a YouTube/Vimeo link.
- **Documents** (`downloads` section, press kit): PDF and ZIP.

### Accepted files & limits
| Kind | Types | Max size | How |
|---|---|---|---|
| Image | JPG, PNG, WebP, AVIF | 25 MB | Route handler `POST /api/admin/media/upload` (Node runtime) → processed by `sharp` → bucket |
| Video | MP4, MOV | 500 MB | Presigned PUT straight from the browser to the bucket (`/api/admin/media/presign`), then `POST /api/admin/media/complete` to register |
| Document | PDF, ZIP | 50 MB | Presigned PUT, same as video |

- Detect the real type with `file-type` (magic bytes); don't trust the file extension or browser MIME type. Reject SVG and HTML uploads (script injection risk).
- Use `accept="image/jpeg,image/png,image/webp,image/avif"` on image inputs. iPhones then convert HEIC photos to JPEG automatically. If a HEIC still arrives, show "Please export this photo as JPEG" instead of failing silently.
- Every upload route verifies the admin JWT itself.

### Image processing pipeline (`lib/media/process-image.ts`, also used by the seed)
1. Auto-rotate from EXIF, then **strip all EXIF/GPS metadata** (privacy: phone photos carry location).
2. Resize so the longest side is ≤ 2400px (never upscale).
3. Encode to **WebP** quality 82 for the served file; keep the untouched original under `originals/` in R2 (for future re-crops).
4. Generate a tiny blurred placeholder (`blur_data_url`) for `next/image` `placeholder="blur"`.
5. Store width, height, size and a SHA-256 hash (to warn "This photo is already in your library").
- Bucket keys: `media/YYYY/MM/<uuid>-<slugified-name>.webp` and `originals/YYYY/MM/<uuid>.<ext>`. Public URL = `/media/` + key (served by the app, see §1).

### Upload UX
- Progress bar per file, cancel button, clear error messages ("This file is 40 MB; the limit is 25 MB").
- After upload, a details panel opens: **alt text (required before publish)**, optional caption, and **focal point** (tap the important spot, e.g. her face, so crops on phone and desktop keep it in frame). Live preview of how the image crops at 16:9, 4:5 and square.
- **Replace file** on an existing media item swaps the file but keeps the same `media.id`, so every page using that photo updates at once (calls `updateTag` for each tag in `media_usage`).

### Media Library screen
- Grid with search (filename, alt, caption), filter by kind and "Unused", sort by newest.
- Detail drawer: preview, dimensions, size, alt/caption/focal editing, **"Used on"** list (from `media_usage`) with links, Replace file, Download original, Delete.
- Delete is blocked while the item is used anywhere; the message lists where. Deleting removes both bucket objects.
- Missing-alt-text badge on any image without alt text.

---

## 6B. Page builder (the core of the back end)

### How it works for Tangie
1. **Admin → Pages** lists every page (title, URL, status, last edited). Buttons: **New Page**, **Edit**, **Duplicate**, **Delete** (non-system pages only).
2. **Edit** opens a split-screen editor:
   - **Left panel (380px):** ordered list of the page's sections, each a card showing the section type icon, a short label (its heading text), and controls: drag handle, eye (hide/show), duplicate, delete.
   - **Right panel:** a **live preview** of the real page in an iframe (`/preview/[pageId]?token=…`) at Desktop / Tablet / Phone widths (toggle buttons). Clicking a section in the preview selects it on the left.
   - Selecting a section opens its **field form** in the left panel (auto-generated from the section's schema, see below). Edits update the preview within ~300ms (debounced `postMessage` to the iframe, no reload).
3. **+ Add Section** (between any two sections, and at the bottom) opens a picker: a grid of every section type with a thumbnail and one-line description, plus a "My Saved Blocks" tab (`section_templates`). Choosing one inserts it with sensible default content.
4. **Save Draft** autosaves every 5 seconds into `draft_props` / draft flags. Nothing changes on the live site.
5. **Publish** copies drafts to live, writes a `page_revisions` snapshot, and calls `updateTag('page:<slug>')` so the live page updates immediately. **Discard Changes** throws drafts away.
6. **History** drawer lists revisions with date and note; **Restore** loads a revision back into the draft so she can review before publishing.
7. **Page Settings** tab: title, URL slug (auto from title, editable, validated unique, reserved slugs blocked: `admin`, `api`, `books`, `events`, `journal`, `preview`, etc.), SEO title & description (with character counters and a Google-style preview), social share image, "Show in header menu" toggle.

### Field types (the form generator must support all of these)
| Field | Admin control | Notes |
|---|---|---|
| `text` | single-line input | max length per field |
| `textarea` | multi-line | plain text |
| `richtext` | TipTap (bold, italic, link, bullet list) | sanitized HTML |
| `image` | **Upload new** / **Choose from library** (+ drag-and-drop) → alt text + focal point (§6C) | stores `media.id` |
| `images` | multi-upload for galleries; reorder by drag; caption per image | array of `media.id` |
| `file` | upload video or document (§6C) | stores `media.id` |
| `button` | label + link (page dropdown or URL) + style (filled/outline) + open in new tab | |
| `buttons` | repeatable `button`, max 2 | |
| `select` | dropdown | for layout variants, background color |
| `toggle` | switch | |
| `number` | number input | e.g. "how many posts to show" |
| `repeater` | add/remove/reorder rows of sub-fields | for lists, FAQs, stats, gallery items |
| `color` | swatches limited to the design tokens only (ivory, ivory-deep, sand, white, ink) | prevents off-brand colors |

### Shared section options (every section has these, under an "Appearance" accordion)
- `background`: ivory | ivory-deep | sand | white | ink (ink flips text to light automatically)
- `spacing`: compact (48px) | normal (96px) | spacious (128px)
- `anchor_id`: optional, for in-page links
- `hidden`: toggle

### Section registry
Implement each as `components/sections/<Type>.tsx` with a matching zod schema in `lib/sections/registry.ts`. The registry is one object mapping `type → { label, description, icon, thumbnail, schema, defaults, component }`. **The admin form is generated from the schema** — adding a new section type later means adding one component + one registry entry, nothing else.

**Mockup sections (seeded on the homepage in this exact order):**
| Type | Fields | Variants |
|---|---|---|
| `hero_split` | title_line_1, title_line_2, role_line, body (textarea), buttons, image | image side: right / left |
| `feature_book` | eyebrow, heading, heading_italic (toggle), body, buttons, image, **book** (dropdown from Books — fills heading/blurb/buy link automatically unless overridden) | image side |
| `image_text` | eyebrow, heading, body (richtext), buttons, image | image side: left / right; image style: framed / full-bleed |
| `dark_feature` | eyebrow, heading, body (richtext), buttons, image (with gradient fade) | — |
| `event_cards` | eyebrow, heading, link label + link, count (1–6), empty-state text, empty-state button | layout: 3-column / list |
| `post_cards` | eyebrow, heading, link label + link, count (3/6/9), category filter (optional) | — |
| `newsletter` | eyebrow, heading, body, button label, success message, decorative image | — |

**Extra building blocks (so she can create new sections and pages):**
| Type | Purpose / fields |
|---|---|
| `page_hero` | Inner-page header: eyebrow, H1, intro, optional background image |
| `rich_text` | Free-form article-style content: richtext body, max width (narrow / wide), alignment |
| `quote` | Large Cormorant pull quote + attribution, optional portrait |
| `two_column_text` | Two richtext columns |
| `cta_banner` | Heading, body, buttons, background (often ink or sand) |
| `image_gallery` | Repeater of images + captions; grid (2/3/4 columns) or masonry; lightbox on click |
| `video` | YouTube / Vimeo URL or uploaded MP4, poster image, caption |
| `stats_row` | Repeater: big number + label (e.g. "24+ Years", "1st Black Box Theatre in SC") |
| `list_feature` | Heading + repeater of items with optional icon (great for Quick Facts, speaking topics) |
| `testimonials` | Pulls approved testimonials; filter by context; carousel or grid |
| `logo_strip` | Repeater of logos + links (WOW Studio One, Destined 2 WOW, press, partners) |
| `faq` | Repeater of question/answer, accessible accordion |
| `credits_list` | Pulls Film & Theater credits; filter by category; featured toggle |
| `book_grid` | Pulls books; filter by series/status |
| `event_list` | Pulls events; upcoming / past / both |
| `post_grid` | Pulls journal posts with category chips and pagination |
| `contact_form` | Contact form; preset inquiry type (optional); heading + intro |
| `booking_form` | Speaking booking form; heading + intro |
| `downloads` | Repeater of files (press kit PDFs, headshots) uploaded to the bucket |
| `embed` | Raw iframe embed for things like a ticketing widget. **Allowlist domains** (YouTube, Vimeo, Eventbrite, Spotify, Google Maps); reject anything else. |
| `spacer_divider` | Space + optional thin bronze rule |

### Guardrails (keep the site looking like the mockup no matter what she does)
- Section components own all layout, fonts and spacing; Tangie only edits **content and approved options**. No free-form CSS, font sizes or arbitrary colors.
- Character limits on headings with a soft warning (e.g. hero line 1 ≤ 14 chars, section headings ≤ 60) so text doesn't break the design.
- Required alt text on every image before publish.
- Publish is blocked with a clear message if a required field is empty or a link is broken (internal links validated against `pages`; external must start `https://`).
- Exactly one `<h1>` per page: the first `hero_split` or `page_hero` renders an H1; every other heading renders as H2. Show a warning if a page has no hero.
- Deleting a section asks for confirmation and is undoable until publish. Deleting a page asks to type the page name and sets up a 301 to `/` (or a chosen page).
- Changing a published page's slug automatically creates a 301 redirect from the old URL (`redirects` table: `from_path`, `to_path`, created_at; checked in `proxy.ts`).

### Technical notes
- `lib/sections/registry.ts` — registry + zod schemas; export a `SectionRenderer` that maps `type` → component and validates props (invalid props render nothing in production and a red notice in preview).
- `app/(site)/[[...slug]]/page.tsx` — catch-all renderer for standard pages (homepage = empty slug). System pages with their own routes (`/journal/[slug]` etc.) also call `SectionRenderer` for their stacks.
- Preview route `/preview/[pageId]` renders `draft_props ?? props`, honors draft add/delete flags, is `noindex`, requires a short-lived signed token (jose) from the admin session.
- Public pages are cached with `'use cache'` + `cacheTag('page:<slug>')`. Publish calls `updateTag('page:<slug>')`; nav changes call `updateTag('nav')`; site settings `updateTag('settings')`. Data sections (`event_cards`, `post_cards`, etc.) tag their queries (`events`, `posts`, `books`) so saving a record in the admin refreshes every page that shows it.
- The `redirects` lookup in `proxy.ts` must be fast: load the table into an in-memory map, refresh it when a redirect is created (bump a version key), and fall back to a DB query on miss.
- Server actions for all builder mutations, each validated against the section schema with zod; reorder is one action that rewrites `sort_order` for the page in a transaction.
- Drag-and-drop with `@dnd-kit/core` + `@dnd-kit/sortable` (works with touch, so reordering works on her phone).
- Images in fields store the `media.id` plus a cached URL; every save rebuilds `media_usage` for that entity so the Media Library knows where each file is used.

### Seeding
`scripts/seed.ts` creates every system page with its section stack pre-filled from `SITE_CONTENT.md`:
- **Home:** `hero_split` → `feature_book` → `image_text` (Meet Tangie, framed, image left) → `dark_feature` (Film & Theater) → `image_text` (Speaking, full-bleed, image left) → `event_cards` → `post_cards` → `newsletter`.
- **About:** `page_hero` → `image_text` (bio) → `quote` (signature quote) → `list_feature` (Quick Facts) → `quote` (second quote) → `logo_strip` (WOW Studio One, Destined 2 WOW) → `cta_banner`.
- **Speaking:** `page_hero` → `rich_text` → `list_feature` (5 topics) → `image_gallery` → `testimonials` (hidden until approved ones exist) → `booking_form` (anchor `inquiry`).
- **Books / Events / Journal / Film & Theater / Contact / Press / Privacy / Terms:** `page_hero` + the matching data or form section.

---

## 7. Forms & email

All public forms: server actions, zod validation, Turnstile verify, honeypot, accessible labels, inline errors, success state.

- **Contact** (`/contact`): first name*, last name*, email*, phone, inquiry type*, message*.
- **Booking** (`/speaking#inquiry`): name*, email*, phone, organization, event type (Author talk / Book club / Faith-based women's event / Teen & youth / Creative leadership / Panel or conference / Workshop / Other), event date, location, audience, estimated attendance, budget range (optional select), message*.
- On submit → insert `inquiries` → Resend email to `INQUIRY_TO_EMAIL` (subject: `[TangieBeaty.com] New {type} inquiry from {name}`) → auto-reply to sender ("Thank you — Tangie's team will respond within 2–3 business days.").
- **Newsletter:** insert/ignore duplicate → Brevo `contacts/doubleOptinConfirmation` → show "Check your inbox to confirm."
- Fire analytics events: `inquiry_submit` (with type), `newsletter_signup`, `book_purchase_click`.

---

## 8. SEO & performance

- **Critical:** the current Wix site has `meta robots: noindex` on every page — Google is being told to ignore it. New site must be **indexable** in production (and `noindex` only on Railway preview URLs and `/admin`).
- `generateMetadata` on every route: unique title (`{Page} | Tangie Brickhouse-Beaty`), description, canonical, Open Graph + Twitter image.
- JSON-LD: `Person` (home/about, with `sameAs` social links), `Book` (book pages), `Event` (event pages), `BlogPosting` (posts).
- `app/sitemap.ts` (dynamic from DB) and `app/robots.ts`.
- Images: `next/image`, explicit sizes, AVIF/WebP, hero `priority`. Target Lighthouse ≥ 90 on all four categories, mobile.
- One `<h1>` per page. Alt text required for every image.

---

## 9. Accessibility

WCAG 2.1 AA: color contrast (check bronze on ivory for small text — use `--bronze` `#8C6B3F`, not `--bronze-light`, for text on light backgrounds), visible focus rings (2px bronze outline, 2px offset), skip-to-content link, keyboard-operable mobile menu with focus trap, labelled form fields, `aria-live` for form status.

---

## 10. Milestones

**M1 — Scaffold & deploy**
Run the version checks in §1, then `npx create-next-app@latest` (TypeScript, App Router, Tailwind, ESLint, Turbopack; Cache Components on). Pin TypeScript to 6.0.x. Run the `agents-md` codemod. **Write and run `scripts/download-wix-assets.ts` (§5B) and commit `seed-assets/` with `manifest.json`** so the Wix images are backed up on day one. Add fonts, design tokens in `@theme`, ESLint flat config + Prettier, `proxy.ts` stub, `/health` route, `.nvmrc` (22), Railway deploy from `main`. Placeholder homepage live on the Railway URL. Report the exact installed versions in the milestone summary.

**M2 — Design system & static homepage**
Build `Header`, `MobileMenu`, `Footer`, `Button`, `Eyebrow`, `SectionHeading`, `ArrowLink`, `DateTile`, `EventCard`, `PostCard`, `NewsletterForm` (UI only). Build all 10 homepage sections with hard-coded content from `SITE_CONTENT.md` and images from `seed-assets/` (copy the chosen files into `public/dev-seed/` for this milestone only; delete that folder in M3). **Never hotlink Wix.** **Compare against the mockup at 1440px, 1024px, 768px, 390px and adjust until it matches.**

> In M2, build each homepage section **as a registry section component that takes props** (not a one-off block of JSX). That way M3 just swaps hard-coded props for DB props, and M7 gets the page builder almost for free.

**M3 — Database, section registry & seed**
Drizzle schema + migrations (including `pages`, `sections`, `page_revisions`, `section_templates`, `nav_items`, `redirects`). Build `lib/sections/registry.ts` with zod schemas for the 7 mockup section types, `SectionRenderer`, and the catch-all `[[...slug]]` route. Seed script loads everything in `SITE_CONTENT.md` (book, 2 past events, 3 posts, quick facts, speaking topics, social links, settings, nav items) and seeds the homepage section stack, then creates the first admin. Build `lib/media/process-image.ts` (§6C) and have the seed push every `seed-assets/manifest.json` slot through it into the bucket + `media` (§5B). Delete `public/dev-seed/`. Add `scripts/check-no-wix.ts` as a `prebuild` step. Homepage now renders entirely from the DB and bucket and still matches the mockup.

**M4 — Remaining section types & inner pages**
Build the 21 extra section types from §6B. Seed About, Speaking, Books, Events, Journal, Film & Theater, Contact, Press, Privacy and Terms as section stacks. Build detail templates `/books/[slug]`, `/events/[slug]`, `/journal/[slug]`, custom 404, redirects from §4 plus the `redirects` table in `proxy.ts`.

**M5 — Forms, email, newsletter**
Contact + booking forms (as `contact_form` / `booking_form` sections), Turnstile, Resend notifications + auto-reply, Brevo double opt-in, analytics events.

**M6 — Admin foundation & content CRUD**
Auth, `proxy.ts` admin guard + per-action JWT checks, admin layout + sidebar, Dashboard, **full upload system and Media Library from §6C** (image pipeline, presigned video/document uploads, multi-upload, alt text, focal point, Replace file, usage tracking, safe delete), upload buttons on every image field in the CRUD screens, CRUD for Books, Events, Journal (TipTap), Credits, Speaking Topics, Testimonials, Inquiries inbox, Subscribers + CSV export, Navigation editor, Site Settings.

**M7 — Page builder**
Pages list, New/Duplicate/Delete page, split-screen editor with live iframe preview (desktop/tablet/phone), schema-driven field forms (all field types in §6B), Add Section picker with thumbnails, drag-and-drop reorder (`@dnd-kit`), hide/duplicate/delete, autosave drafts, Publish / Discard, revision history + restore, Save as reusable block, Page Settings (slug + SEO + share image + show in menu), all guardrails from §6B. **Acceptance test:** logged in on a phone, create a new page called "Workshops" with a hero, a gallery and a booking form, add it to the menu, publish, and see it live; then reorder two homepage sections, publish, and restore the previous revision.

**M8 — SEO, a11y, performance**
Metadata from page SEO fields, JSON-LD, sitemap that includes builder-created pages, robots, OG images, Lighthouse + axe pass on every section type, fix all issues.

**M9 — Launch**
Point `tangiebeaty.com` + `www` DNS to Railway (domain may currently be registered through Wix — confirm and either transfer or update DNS records there), verify SSL, set `www` as canonical with apex redirect, submit sitemap in Google Search Console, test every form end-to-end in production, complete the **"Before Wix is cancelled" checklist in §5B** (only then tell the client Wix can be shut off), write `HANDOVER.md` in plain language with screenshots: how Tangie edits text and photos, adds/reorders/hides a section, creates a new page and puts it in the menu, publishes and restores a previous version, and adds a post, an event and a book.

---

## 11. Known issues on the current site (fix in rebuild)

- Every page is `noindex` → invisible to Google.
- Footer says "© 2035 by T. Hall" (template leftover).
- "Product Page" nav link returns **404**.
- "Join the Mailing List" links to the contact page — there is no real newsletter signup.
- Blog posts are attributed to "WOW Performing Arts Center" instead of Tangie.
- Book purchase goes through a Wix paylink (`/_paylink/AZ0NJA5n`) that will stop working when Wix is cancelled.
- No Film & Theater content exists — must be supplied by the client.
- Hero logo is a white PNG over a photo; mockup uses a typographic wordmark instead.

## 12. Open questions for the client (do not block build — use placeholders flagged `TODO(client)`)

1. Original image files for the mockup (drop into `seed-assets/mockup/`), and confirmation they're approved for use. If any mockup photo of Tangie is AI-generated rather than a real photo, it needs her sign-off or replacement with a real shot. Also: hi-res speaking and stage/production photos, and the original launch video file.
2. Book purchase: keep selling signed copies directly (→ Stripe Payment Link) and/or link to Amazon / Books-A-Million / other retailers? Need the URLs.
3. Full Film & Theater credits list, years, roles, and the streaming URLs for *Secrets in Plain Sight* (Tubi, Peacock).
4. Upcoming events for late 2026 / Justified Lies tour dates.
5. Show phone (803.545.4256) and Gmail publicly, or form-only? Is there a domain email to use for sending?
6. Social: mockup shows YouTube (no URL on current site) and drops X. Provide YouTube URL; keep or drop X?
7. Approved testimonials and reader reviews.
8. Who owns the domain registration, and is Wix also the registrar?
