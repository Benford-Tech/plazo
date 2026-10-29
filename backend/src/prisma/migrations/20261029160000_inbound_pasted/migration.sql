-- 29/10/2026 (« pouvoir importer en collant le contenu du mail »): an email whose text a staff member pasted in the inbox.
ALTER TYPE "InboundDelivery" ADD VALUE 'pasted';
ALTER TABLE "inbound_emails" ADD COLUMN "pastedBy" TEXT;
