-- 11/11/2026 (« variabilise au max »): the driver's phone and the traveller conditions of the day-before message.
ALTER TABLE "parkings" ADD COLUMN "driverPhone" TEXT;
ALTER TABLE "parkings" ADD COLUMN "travellerConditions" TEXT;
ALTER TABLE "parkings" ADD CONSTRAINT "parkings_driver_phone_length" CHECK ("driverPhone" IS NULL OR char_length("driverPhone") <= 30);
ALTER TABLE "parkings" ADD CONSTRAINT "parkings_traveller_conditions_length" CHECK ("travellerConditions" IS NULL OR char_length("travellerConditions") <= 400);
