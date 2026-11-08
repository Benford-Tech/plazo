-- 08/11/2026 (« mets le mail à jour »): the saved prospecting sequence takes the new default texts (concise mails, features,
-- what travellers gain). Only the subjects and bodies are removed; each step keeps its delay and whether it is on, and
-- stepsOf() fills the texts from defaultSteps().
UPDATE "prospecting_settings"
SET "steps" = (SELECT jsonb_agg(s - 'subject' - 'body') FROM jsonb_array_elements("steps") AS s)
WHERE jsonb_typeof("steps") = 'array';
