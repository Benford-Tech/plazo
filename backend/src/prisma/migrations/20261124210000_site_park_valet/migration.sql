-- 24/11/2026 (« tout », after aerpark.fr and onevalet.fr): two more looks for a parking's site, and the messages of its
-- contact form in « Messages ».
ALTER TABLE "operator_sites" DROP CONSTRAINT "operator_sites_theme";
ALTER TABLE "operator_sites"
  ADD CONSTRAINT "operator_sites_theme" CHECK ("theme" IN ('simple', 'showcase', 'night', 'postcard', 'home', 'express', 'park', 'valet'));

ALTER TABLE "whatsapp_inbox_messages" DROP CONSTRAINT "whatsapp_inbox_messages_channel";
ALTER TABLE "whatsapp_inbox_messages" ADD CONSTRAINT "whatsapp_inbox_messages_channel" CHECK ("channel" IN ('whatsapp', 'app', 'sms', 'site'));
