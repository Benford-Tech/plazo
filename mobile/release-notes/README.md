# Notes de version des apps

Les notes de la prochaine version, en français : `plazo.txt` (app voyageur) et `plazo-pro.txt` (Plazo Pro). Codemagic
(`mobile-release`, `mobile-release-android`) les envoie à Google Play (« Nouveautés », fr-FR) et à l'App Store
(« Nouveautés de cette version », fr-FR) ; absentes ou vides, le build s'arrête avant de construire.

- Ce que le voyageur ou l'équipe voit changer depuis la dernière version, pas la technique ; une puce `•` par nouveauté.
- 500 caractères au plus (limite de Google Play), texte brut.
- À tenir à jour avec chaque changement des apps.

Le numéro de version se calcule seul : `MAJEUR.MINEUR` de `pubspec.yaml` (`version: 1.0.0+1` → 1.0) puis le numéro de build
(1.0.131, 1.0.132…). On ne change `pubspec.yaml` que pour un grand pas (1.1, 2.0).
