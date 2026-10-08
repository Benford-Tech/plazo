#!/usr/bin/env bash
# M-A mail relay (Brevo Inbound parsing): checks the MX records of the receiving domain and creates
# the inbound webhook that posts every email to Plazo. Run it from your own machine; nothing is
# printed that contains the secret.
#
#   BREVO_API_KEY=… INBOUND_EMAIL_SECRET=… backend/scripts/brevo-inbound-setup.sh
#
# Optional: INBOUND_EMAIL_DOMAIN (default in.plazo.fr), PUBLIC_SITE_URL (default https://www.plazo.fr).
set -euo pipefail

DOMAIN="${INBOUND_EMAIL_DOMAIN:-in.plazo.fr}"
SITE="${PUBLIC_SITE_URL:-https://www.plazo.fr}"
: "${BREVO_API_KEY:?BREVO_API_KEY manquante (clé API Brevo, jamais dans le dépôt)}"
: "${INBOUND_EMAIL_SECRET:?INBOUND_EMAIL_SECRET manquante (la même valeur que dans Vercel)}"
WEBHOOK_URL="${SITE%/}/api/public/inbound/email?secret=${INBOUND_EMAIL_SECRET}"
MASKED="${SITE%/}/api/public/inbound/email?secret=••••"

echo "1/3  MX de ${DOMAIN} (attendus : inbound1.sendinblue.com. priorité 10, inbound2.sendinblue.com. priorité 20)"
if command -v dig >/dev/null 2>&1; then
  MX=$(dig +short MX "$DOMAIN" || true)
elif command -v nslookup >/dev/null 2>&1; then
  MX=$(nslookup -type=MX "$DOMAIN" 2>/dev/null | grep -i "mail exchanger" || true)
else
  MX=""
fi
if [ -z "$MX" ]; then
  echo "     aucun MX trouvé (DNS pas encore propagé, ou dig/nslookup absents) : ajoutez-les chez le registrar de plazo.fr"
else
  echo "$MX" | sed 's/^/     /'
  echo "$MX" | grep -qi "inbound1.sendinblue.com" || echo "     ATTENTION : inbound1.sendinblue.com. manque"
fi

echo "2/3  Webhooks inbound déjà déclarés chez Brevo"
EXISTING=$(curl -sS -H "api-key: ${BREVO_API_KEY}" "https://api.brevo.com/v3/webhooks?type=inbound")
if echo "$EXISTING" | grep -q "\"domain\":\"${DOMAIN}\""; then
  echo "     un webhook existe déjà pour ${DOMAIN} : rien à créer"
  echo "$EXISTING" | sed "s#${INBOUND_EMAIL_SECRET}#••••#g" | sed 's/^/     /'
  exit 0
fi
echo "     aucun pour ${DOMAIN}"

echo "3/3  Création du webhook → ${MASKED} (domaine ${DOMAIN})"
BODY=$(printf '{"type":"inbound","events":["inboundEmailProcessed"],"url":"%s","domain":"%s","description":"Plazo — mails des comparateurs"}' "$WEBHOOK_URL" "$DOMAIN")
RESULT=$(curl -sS -w "\n%{http_code}" -H "api-key: ${BREVO_API_KEY}" -H "content-type: application/json" -X POST "https://api.brevo.com/v3/webhooks" --data "$BODY")
CODE=$(echo "$RESULT" | tail -n1)
echo "$RESULT" | sed '$d' | sed "s#${INBOUND_EMAIL_SECRET}#••••#g" | sed 's/^/     /'
if [ "$CODE" = "201" ]; then
  echo "     OK (201). Envoyez un mail de test à <slug>@${DOMAIN} : il apparaît dans Réservations › Mails à vérifier."
else
  echo "     Échec (HTTP ${CODE}) : vérifiez la clé API, que le domaine ${DOMAIN} est ajouté dans Transactional › Inbound parsing, et les MX."
  exit 1
fi
