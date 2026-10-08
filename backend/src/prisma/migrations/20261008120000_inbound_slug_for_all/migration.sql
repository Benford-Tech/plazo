-- Every operator has its inbound address from the start (08/10/2026): give one to the operators created before,
-- shaped like newInboundSlug() (slug cut to 24 characters + 4 random hex characters), unique among operators.
DO $$
DECLARE
  op RECORD;
  candidate TEXT;
BEGIN
  FOR op IN SELECT "id", "slug" FROM "operators" WHERE "inboundSlug" IS NULL LOOP
    LOOP
      candidate := coalesce(nullif(rtrim(left(op."slug", 24), '-'), ''), 'parking') || '-' || substr(md5(random()::text || op."id"), 1, 4);
      EXIT WHEN NOT EXISTS (SELECT 1 FROM "operators" WHERE "inboundSlug" = candidate);
    END LOOP;
    UPDATE "operators" SET "inboundSlug" = candidate WHERE "id" = op."id";
  END LOOP;
END $$;
