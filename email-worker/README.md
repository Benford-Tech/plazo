# Relais des mails entrants (Cloudflare Email Worker)

Chaque parking a son adresse Plazo, `<slug>@plazo.fr`, créée avec lui (Parking › Réglages › Mails entrants l'affiche).
Sa messagerie y transfère les confirmations des comparateurs (Allopark…). **Cloudflare Email Routing** reçoit tout
le domaine `plazo.fr` (gratuit, nombre d'adresses illimité, aucune boîte mail à créer) et passe chaque mail à ce
Worker. Le Worker envoie le mail **tel quel** à l'API, qui le décode (08/10/2026 : l'offre Workers Free n'accorde que
10 ms de processeur par mail, et décoder une vraie confirmation, HTML et images, les dépassait : l'expéditeur recevait
« upstream (worker:plazo) temporary error: Worker call failed after 3 attempts ») :

```
POST https://www.plazo.fr/api/public/inbound/email
Content-Type: message/rfc822
X-Inbound-Secret: <INBOUND_EMAIL_SECRET>
X-Envelope-From: <expéditeur de l'enveloppe>
X-Envelope-To: <adresse Plazo du parking>
X-Inbound-Truncated: 1        (seulement quand le mail dépassait 4 Mo et a été coupé là)

<le mail brut, tel que reçu>
```

`X-Envelope-To` porte l'adresse Plazo de l'enveloppe : c'est elle qui désigne le parking, pas l'en-tête `To` du mail
transféré. Un mail de plus de 4 Mo (limite des requêtes Vercel) est coupé à 4 Mo : ses textes, placés avant les pièces
jointes, restent lus. Si Plazo ne prend pas le mail (erreur, secret faux), ou si l'adresse n'est à aucun parking (réponse d'un
voyageur à `reservations@plazo.fr`, `contact@plazo.fr`…), le Worker le renvoie à `FALLBACK_ADDRESS` quand elle est
définie. Sinon, il le refuse, et la messagerie de l'expéditeur signale l'échec : rien ne se perd en silence.

**Pourquoi le domaine principal et pas `in.plazo.fr` (R-A, 08/10/2026)** : Cloudflare n'accepte la règle « catch-all »
(toutes les adresses) que sur le domaine principal ; sur un sous-domaine il faut une règle par adresse, 200 au plus.

## Mise en place (une fois)

Le domaine `plazo.fr` reste enregistré chez Hostinger. Seuls ses DNS passent chez Cloudflare. Aucune boîte mail ne doit
exister ailleurs en `@plazo.fr` (Hostinger…) : Email Routing devient le seul receveur du domaine.

1. **Cloudflare** (offre Free) : « Add a site » › `plazo.fr`.
   - Vérifie les enregistrements recopiés : ceux de Vercel (`plazo.fr`, `www`) doivent être en « DNS only » (nuage gris).
   - Dans hPanel (Domaines › plazo.fr › Serveurs de noms), remplace les serveurs de noms par les deux de Cloudflare.
   - Aucun enregistrement `in` ne doit rester sur le domaine (un CNAME `in` créé par Brevo s'y est glissé un temps).
2. **Email Routing** : Compute › Email Service › Email Routing › `plazo.fr` › activer. Cloudflare pose les MX et le SPF de
   `plazo.fr` ; Brevo (envoi) n'en a pas besoin, ses signatures DKIM suffisent.
3. **Worker** : déployé par GitHub Actions (`.github/workflows/email-worker-ci.yml`, job `deploy`) à chaque fusion sur
   `main` qui touche `email-worker/`, ou à la main (Actions › « Email worker CI » › Run workflow). Il faut deux secrets dans
   l'environnement **Production** du dépôt (GitHub › Settings › Environments › Production › Environment secrets) :
   - `CLOUDFLARE_API_TOKEN` : Cloudflare › profil › API Tokens › Create Token › modèle « Edit Cloudflare Workers » ;
   - `CLOUDFLARE_ACCOUNT_ID` : Workers & Pages › Overview, colonne de droite.
   Le Worker s'appelle `plazo` (le nom de `wrangler.toml`). L'import du dépôt par Cloudflare lui-même (Workers Builds) n'a
   pas réussi à le déployer ; GitHub Actions le remplace.
   - Puis Paramètres › Variables et secrets : ajoute le **secret** `INBOUND_EMAIL_SECRET`.
   - Choisis toi-même une longue valeur aléatoire (gestionnaire de mots de passe) et ne la colle nulle part ailleurs que dans Cloudflare et dans Vercel.
   - Ajoute aussi la variable `FALLBACK_ADDRESS` = la boîte de Plazo. **Elle doit être une adresse de destination vérifiée**
     (étape 4), sinon Cloudflare refuse le renvoi et le Worker refuse le mail avec son motif. `keep_vars` dans
     `wrangler.toml` la garde d'un déploiement à l'autre.
4. **Adresse de destination** : Email Routing › Destination Addresses › la boîte de Plazo (Gmail…) › clique le lien de
   vérification reçu.
5. **Règles** : Email Routing › Routing Rules.
   - `reservations` @ plazo.fr › « Send to an email » › la boîte de Plazo (les réponses des voyageurs aux mails envoyés par
     Brevo). Une règle précise passe avant le catch-all.
   - **Catch-all** › « Send to a Worker » › `plazo`, puis mets l'interrupteur de la règle sur **Active** (désactivé par défaut).
     Si la liste dit « No deployed Email Workers found », le Worker déployé n'a pas de gestionnaire `email` : regarde le
     dernier build (Workers & Pages › `plazo` › Deployments) ; le nom dans `wrangler.toml` doit être celui du tableau de bord.
6. **Vercel** (projet `plazo`, Production) :
   - `INBOUND_EMAIL_DOMAIN` = `plazo.fr` ;
   - `INBOUND_EMAIL_SECRET` = le même secret, type Sensitive.
   - Puis relance un déploiement.
7. **Essai** : Parking › Réglages › Mails entrants › « Relier ma boîte mail ». L'assistant donne l'adresse du parking et affiche en direct le premier mail reçu.

## Déployer à la main depuis le tableau de bord (sans build Git)

Si le Worker `plazo` n'apparaît pas dans la liste « Send to a Worker » du catch-all (« No deployed Email Workers found »),
le code déployé n'a pas de gestionnaire `email`. Sans attendre le build Git :

```
cd email-worker && npm ci && npx wrangler deploy --dry-run --outdir=dist
```

produit `dist/index.js`, le Worker en un seul fichier (le décodeur `postal-mime` inclus). Workers & Pages › `plazo` ›
**Edit code** › remplace tout le contenu par ce fichier › **Deploy**. Vérifie ensuite dans Settings › Variables and Secrets :
`PLAZO_INBOUND_URL` = `https://www.plazo.fr/api/public/inbound/email` (à ajouter à la main dans ce cas, le fichier
`wrangler.toml` n'ayant pas été lu), le secret `INBOUND_EMAIL_SECRET` et `FALLBACK_ADDRESS`.

## Commandes

```
npm ci
npm test            # décodage et envoi, sans réseau
npm run typecheck
npx wrangler deploy # déploiement à la main (sinon : à chaque push, par Cloudflare)
```
