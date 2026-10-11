# Captures d'écran des stores (Plazo et Plazo Pro)

Les captures téléphone de Google Play (1080 × 1920, format 9:16) et celles de l'App Store (iPhone 6,9", 1320 × 2868)
des deux apps, prises sur les vraies apps construites pour le web, avec des données de démonstration. Résultat dans
`brand/stores/screenshots/plazo/` et `brand/stores/screenshots/plazo-pro/` (sept écrans chacune, numérotés dans l'ordre
de la fiche), et dans leur sous-dossier `app-store/` pour la taille iPhone.

## Ce que fait la prise de vue

1. Une base PostgreSQL + PostGIS **neuve et vide** (son nom finit par `_shots`) reçoit les migrations et les données
   de démonstration (`seed-demo --apply` : cinq parkings à Lyon Saint-Exupéry).
2. L'API démarre avec son horloge réglée à 14:05 au parking (`fake-clock.cjs`, variable `LOCAL_TIME`), quelle que
   soit l'heure de la prise de vue, et le navigateur suit la même horloge.
3. `scenario.mjs` prépare une journée au premier parking (Parkair Lyon) par l'API : douze files de voiturier, des
   arrivées, des retours, une navette, et les trois réservations voyageur (dépôt aujourd'hui, retour aujourd'hui,
   réservation à venir). Personnes, plaques et téléphones sont fictifs.
4. `stage.sql` habille le parking comme en production : pas de badge « DÉMO », réservations Plazo payées en ligne,
   SMS par Brevo. Pour la prise de vue, l'API reçoit des clés factices de vols, SMS et notifications (le bandeau
   des services du tableau de bord dit « OK » comme en production) ; les vols pointent vers un port local fermé,
   aucun appel réel n'est fait pour eux.
5. `capture.mjs` pilote les deux apps avec Chromium (fuseau Europe/Paris, position GPS sur la route de l'aéroport) et
   enregistre les captures : d'abord en `DEVICE=phone` (fenêtre 405 × 720 à 8/3 pixels par point, Google Play), puis,
   la journée remise en place (trajet clos, poste du gérant effacé), en `DEVICE=iphone` (440 × 956 à 3 pixels par
   point, l'iPhone 16 Pro Max : mêmes écrans, la fenêtre plus haute montre simplement plus de contenu).

## La lancer

Sur GitHub : **Actions › Store screenshots › Run workflow** (heure au parking au choix). Les PNG reviennent en
artefact `store-screenshots` (7 jours). Rien n'est publié ni enregistré dans le dépôt, aucun secret n'est utilisé.

En local (Node 22, Flutter 3.47.6, `psql`, Chromium de Playwright, accès réseau aux tuiles IGN et aux photos) :

```bash
createdb plazo_shots
SHOTS_DATABASE_URL=postgresql://utilisateur:motdepasse@localhost:5432/plazo_shots brand/stores/tools/screenshots/run.sh
```

Variables utiles : `OUT_DIR` (dossier des captures), `LOCAL_TIME` (heure au parking, `14:05`), `FLUTTER` (chemin de
Flutter), `SKIP_BACKEND_BUILD=1`, `SKIP_FLUTTER_BUILD=1` avec `WORK` (réutiliser des builds web), `API_PORT`,
`TRAVELLER_PORT`, `PRO_PORT`. Le script refuse une base qui n'est pas vide : il ne supprime jamais rien.

## Les écrans

| Plazo | Plazo Pro |
|---|---|
| 01 Rechercher (carte des parkings, le moins cher) | 01 Tableau de bord |
| 02 Résultats | 02 Planning du jour |
| 03 Fiche d'un parking | 03 Fiche réservation, « Prochaine étape » |
| 04 « C'est réservé ! » | 04 Parking : files de voiturier |
| 05 Jour du dépôt : « Prévenez le parking » | 05 Navette : « Ma tournée » (poste Chauffeur) |
| 06 Jour du retour : compte à rebours | 06 Trajet en cours, position partagée |
| 07 Retrouver ma voiture | 07 « Aujourd'hui, je suis… » |

Google Play en accepte huit par app ; l'App Store en accepte dix (les sept de `app-store/` suffisent, 5 ou 6 sont
conseillées ; les tailles sont dans `mobile/fiches-stores.md`, section 5.1).
