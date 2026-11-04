-- 04/11/2026 (« Configuration place = crochet »): keys left go on the hook of the car's place, on by default.
ALTER TABLE "parkings" ADD COLUMN "keyHookIsPlace" BOOLEAN NOT NULL DEFAULT true;
