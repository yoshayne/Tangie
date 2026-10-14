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
`REDIS_URL` (used from M5/M6), and `NEXT_PUBLIC_SITE_URL`.

Service settings: branch `main`. Nothing else is needed.

On startup the server creates/updates the database tables and loads the starting content and photos
(`npm run db:migrate && npm run seed`, logged with a `[setup]` prefix). It only creates what is missing and
never overwrites existing content, so it is safe on every start. Set `SKIP_AUTO_SETUP=true` to turn it off.
The build does not need the database (pages are read when requested, then cached).

Checking a deploy:

- `/health` returns `{"ok":true}` when the server is up.
- `/health?deep=1` also checks the database, the loaded content and file storage, and names the problem if one fails.

Before launch run `npm run check:wix:prod` against the production database.
