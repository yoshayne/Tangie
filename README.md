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

Service settings:

- Branch: `main`
- Pre-deploy command: `npm run db:migrate && npm run seed`

The seed only creates what is missing and never overwrites existing content, so it is safe on every deploy.
The build does not need the database (pages are read when requested, then cached).

Before launch run `npm run check:wix:prod` against the production database.
