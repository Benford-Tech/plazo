-- 30/10/2026: a member's photo (the key in the private photo store) and when it was last changed.
ALTER TABLE "staff" ADD COLUMN "photoKey" TEXT;
ALTER TABLE "staff" ADD COLUMN "photoUpdatedAt" TIMESTAMP(3);
