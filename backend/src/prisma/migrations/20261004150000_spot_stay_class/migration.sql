-- CreateEnum
CREATE TYPE "StayClass" AS ENUM ('short', 'medium', 'long');

-- AlterTable
ALTER TABLE "parking_spots" ADD COLUMN "depth" INTEGER, ADD COLUMN "fileLength" INTEGER, ADD COLUMN "stayClass" "StayClass";
