-- The day-before SMS (« SMS de la veille », S-A + S-B, 06/10/2026).

-- AlterTable
ALTER TABLE "reservations" ADD COLUMN "reminderExcludedAt" TIMESTAMP(3),
ADD COLUMN "reminderExcludedById" TEXT;

-- CreateTable
CREATE TABLE "reminder_settings" (
    "id" TEXT NOT NULL,
    "parkingId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sendTime" TEXT NOT NULL DEFAULT '18:00',
    "template" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminder_settings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reminder_settings_send_time" CHECK ("sendTime" ~ '^(1[6-9]|2[01]):(00|30)$'),
    CONSTRAINT "reminder_settings_template_length" CHECK ("template" IS NULL OR char_length("template") BETWEEN 1 AND 2000)
);

-- CreateTable
CREATE TABLE "reminder_evenings" (
    "id" TEXT NOT NULL,
    "parkingId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "sendTime" TEXT,
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminder_evenings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reminder_evenings_date" CHECK ("date" ~ '^\d{4}-\d{2}-\d{2}$'),
    CONSTRAINT "reminder_evenings_send_time" CHECK ("sendTime" IS NULL OR "sendTime" ~ '^(1[6-9]|2[01]):(00|30)$')
);

-- CreateIndex
CREATE UNIQUE INDEX "reminder_settings_parkingId_key" ON "reminder_settings"("parkingId");

-- CreateIndex
CREATE UNIQUE INDEX "reminder_evenings_parkingId_date_key" ON "reminder_evenings"("parkingId", "date");

-- AddForeignKey
ALTER TABLE "reminder_settings" ADD CONSTRAINT "reminder_settings_parkingId_fkey" FOREIGN KEY ("parkingId") REFERENCES "parkings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder_evenings" ADD CONSTRAINT "reminder_evenings_parkingId_fkey" FOREIGN KEY ("parkingId") REFERENCES "parkings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
