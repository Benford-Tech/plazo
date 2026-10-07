-- R-B (07/10/2026): who sees the position of a parking's shuttles.

-- CreateEnum
CREATE TYPE "ShuttleTracking" AS ENUM ('off', 'team', 'everyone');

-- AlterTable
ALTER TABLE "parkings" ADD COLUMN "shuttleTracking" "ShuttleTracking" NOT NULL DEFAULT 'team';

-- The parkings already there keep what they had: shared with the team and the travellers.
UPDATE "parkings" SET "shuttleTracking" = 'everyone';
