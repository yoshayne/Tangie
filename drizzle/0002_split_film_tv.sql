-- "Film & TV" is now two separate types. The one existing credit (a TV series) becomes TV.
UPDATE "credits" SET "category" = 'tv' WHERE "category" = 'film_tv';--> statement-breakpoint
UPDATE "sections" SET "props" = jsonb_set("props", '{category}', '"tv"') WHERE "props"->>'category' = 'film_tv';
