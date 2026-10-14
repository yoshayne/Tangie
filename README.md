# Tangie

TangieBeaty.com rebuild. The full spec and milestones are in `CLAUDE.md`.

## Local development

```
npm install
cp .env.example .env.local        # point DATABASE_URL at a local Postgres
npm run db:migrate                # create the tables
npm run seed                      # load content + photos (safe to re-run)
npm run dev
```

With no `BUCKET_*` variables set, photos are stored in `./.local-media`.

## Railway

Service variables: `DATABASE_URL`, the five `BUCKET_*` variables (reference the Postgres and Bucket services),
`REDIS_URL`, and `NEXT_PUBLIC_SITE_URL`.

Email and signup (Brevo) variables, all optional until you are ready: `BREVO_API_KEY`, `INQUIRY_FROM_EMAIL`,
`BREVO_LIST_ID`, `BREVO_DOI_TEMPLATE_ID` (see `.env.example`). Until `BREVO_API_KEY` and `INQUIRY_FROM_EMAIL` are set,
the contact and booking forms say sending is not live yet instead of accepting messages nobody would see.
Cloudflare Turnstile (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`) and Plausible
(`NEXT_PUBLIC_PLAUSIBLE_DOMAIN`) switch on automatically when their variables exist.

Service settings: branch `main`. Nothing else is needed.

On startup the server creates/updates the database tables and loads the starting content and photos
(`npm run db:migrate && npm run seed`, logged with a `[setup]` prefix). It only creates what is missing and
never overwrites existing content, so it is safe on every start. Set `SKIP_AUTO_SETUP=true` to turn it off.
The build does not need the database (pages are read when requested, then cached).

Checking a deploy:

- `/health` returns `{"ok":true}` when the server is up.
- `/health?deep=1` also checks the database, the loaded content and file storage, names the problem if one fails, and shows which optional services (Brevo, Turnstile, Redis) are switched on.

Before launch run `npm run check:wix:prod` against the production database.

## Admin (`/admin`)

For now the admin is **open**: anyone who knows the `/admin` address can use it, and a banner says so. It locks itself (login page, 7-day session, rate limiting) as soon as these three variables exist on the server: `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`. Setting `ADMIN_DISABLED=true` hides the admin completely (404).

To lock it:

1. On your computer run `npm run hash-password -- "your long password"` and copy the printed hash.
2. In Railway → Variables add `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` (the hash) and `JWT_SECRET` (random text, 32+ characters).
3. Redeploy. The first start creates the admin account; sign in at `/admin/login`.

What is in it: Dashboard, Books, Events, Journal (rich-text editor with photos), Film & Theater credits, Speaking topics, Testimonials, Inquiries inbox, Subscribers (CSV download), Media Library (upload, alt text, focal point, replace, safe delete), Navigation and Site Settings (social links, partner links, journal categories, announcement bar).

### Page builder (Admin → Pages)

Every page, including the homepage, is a stack of sections. In **Admin → Pages**, pick a page and **Edit**:

- Left: the page's sections (drag to reorder, or use the arrows; eye = hide; duplicate; delete). Click a section to edit its fields. **+ Add section** opens the picker (28 section types, plus your own saved blocks). **Page settings** holds the title, web address, search text, share photo and "Show in the header menu".
- Right: a live preview (desktop / tablet / phone). Click a section in the preview to select it on the left. On a phone the two sides become Edit / Preview tabs.
- Changes save automatically as a **draft** (nothing changes on the live site). **Publish** checks the page (descriptions on photos, links, required fields), then puts it live and remembers the version in **History**, where any of the last 25 versions can be restored into the draft. **Discard changes** throws the draft away; **Undo/Redo** cover edits made in this session.
- Photos: each photo field has **Adjust position and size**. Drag the photo inside a frame shaped like its real slot (tabs show the computer and phone shapes), or use the sliders and zoom buttons. It is never cropped automatically, and the choice belongs to that one use of the photo (stored as `crop` in the section).
- New pages start with a title section; they are not visible on the website until published.

How drafts are stored: `pages.draft` (JSON) holds the unpublished copy of the whole page (sections, order, hidden flags, settings). `sections.draft_props`, `is_draft_new` and `is_draft_deleted` exist from the first schema but are not used; ordering and hiding are page-level drafts, so one column covers everything.

Adding a new section type: add its component, a zod schema + entry in `lib/sections/registry.tsx`, and its editor fields in `lib/sections/meta.ts`. `npm run check:sections` (runs before every build) fails if the two lists differ.
