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

The admin is **switched off** until these three variables exist on the server: `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`. Until then every `/admin` and `/api/admin` address returns 404.

To turn it on:

1. On your computer run `npm run hash-password -- "your long password"` and copy the printed hash.
2. In Railway → Variables add `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` (the hash) and `JWT_SECRET` (random text, 32+ characters).
3. Redeploy. The first start creates the admin account; sign in at `/admin/login`.

What is in it: Dashboard, Books, Events, Journal (rich-text editor with photos), Film & Theater credits, Speaking topics, Testimonials, Inquiries inbox, Subscribers (CSV download), Media Library (upload, alt text, focal point, replace, safe delete), Navigation and Site Settings (social links, partner links, journal categories, announcement bar).
