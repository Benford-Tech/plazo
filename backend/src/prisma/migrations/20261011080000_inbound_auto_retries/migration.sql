-- 11/10/2026 (« Lance l'analyse automatiquement pour allopark ») : the re-analyses Plazo makes by itself of an email whose
-- Allopark booking page it could not read at reception (five at most, over two days).
ALTER TABLE "inbound_emails" ADD COLUMN     "autoRetries" INTEGER NOT NULL DEFAULT 0;
