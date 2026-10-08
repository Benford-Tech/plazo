# Relais des mails entrants (Cloudflare Email Worker)

Chaque parking a son adresse Plazo, `<slug>@in.plazo.fr`, activée dans Parking › Réglages › Mails entrants.
Sa messagerie y transfère les confirmations des comparateurs (Allopark…). **Cloudflare Email Routing** reçoit tout
le domaine `in.plazo.fr` (gratuit, nombre d'adresses illimité, aucune boîte mail à créer) et passe chaque mail à ce
Worker. Le Worker le décode (`postal-mime`) et l'envoie à l'API :

```
POST https://www.plazo.fr/api/public/inbound/email
X-Inbound-Secret: <INBOUND_EMAIL_SECRET>
{ "items": [{ "From", "To", "Cc", "Recipients", "Subject", "RawTextBody", "RawHtmlBody", … }] }
```

`Recipients` porte l'adresse Plazo de l'enveloppe : c'est elle qui désigne le parking, pas l'en-tête `To` du mail
transféré. Si Plazo ne prend pas le mail (erreur, secret faux), le Worker le renvoie à `FALLBACK_ADDRESS` quand elle
est définie. Sinon, il le refuse, et la messagerie de l'expéditeur signale l'échec : rien ne se perd en silence.

## Mise en place (une fois)

Le domaine `plazo.fr` reste enregistré chez Hostinger. Seuls ses DNS passent chez Cloudflare.

1. **Cloudflare** (offre Free) : « Add a site » › `plazo.fr`.
   - Vérifie les enregistrements recopiés : ceux de Vercel (`plazo.fr`, `www`) doivent être en « DNS only » (nuage gris), et ceux des boîtes mail Hostinger en `@plazo.fr` éventuelles doivent rester.
   - Dans hPanel (Domaines › plazo.fr › Serveurs de noms), remplace les serveurs de noms par les deux de Cloudflare.
2. **Email Routing** : Email › Email Routing.
   - Active le routage puis, dans Paramètres › Sous-domaines, ajoute `in.plazo.fr` ; Cloudflare crée ses enregistrements MX et SPF.
   - Si tu as des boîtes mail Hostinger en `@plazo.fr`, ne laisse pas Cloudflare remplacer les MX de `plazo.fr` lui-même.
3. **Worker** : Workers & Pages › Créer › Importer un dépôt.
   - Choisis `Benford-Tech/plazo`, dossier racine `email-worker`, commande de déploiement `npx wrangler deploy`.
   - Puis Paramètres › Variables et secrets : ajoute le **secret** `INBOUND_EMAIL_SECRET`.
   - Choisis toi-même une longue valeur aléatoire (gestionnaire de mots de passe) et ne la colle nulle part ailleurs que dans Cloudflare et dans Vercel.
4. **Règle** : Email Routing › Règles de routage › « Catch-all » de `in.plazo.fr`.
   - Action « Envoyer à un Worker » › `plazo-email-worker`.
5. **Vercel** (projet `plazo`, Production) :
   - `INBOUND_EMAIL_DOMAIN` = `in.plazo.fr` ;
   - `INBOUND_EMAIL_SECRET` = le même secret, type Sensitive.
   - Puis relance un déploiement.
6. **Essai** : Parking › Réglages › Mails entrants › « Relier ma boîte mail ». L'assistant donne l'adresse du parking et affiche en direct le premier mail reçu.

Facultatif : `FALLBACK_ADDRESS` dans `wrangler.toml`. Ce doit être une adresse de destination vérifiée dans Email Routing ; elle garde les mails que Plazo n'a pas pu prendre.

## Commandes

```
npm ci
npm test            # décodage et envoi, sans réseau
npm run typecheck
npx wrangler deploy # déploiement à la main (sinon : à chaque push, par Cloudflare)
```
