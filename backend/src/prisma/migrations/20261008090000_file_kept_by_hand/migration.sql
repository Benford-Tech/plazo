-- Planning des files (08/10/2026): a file kept for a return day by hand survives the night preparation.
ALTER TABLE "parking_files" ADD COLUMN "keptByHand" BOOLEAN NOT NULL DEFAULT false;
