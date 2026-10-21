# Notes de version des apps

Une version publiée par Codemagic (`mobile-release`, `mobile-release-android`) a besoin de ses notes, en français :
`release-notes/<version>/plazo.txt` et `release-notes/<version>/plazo-pro.txt`, `<version>` étant celle de `pubspec.yaml`
(`version: 1.2.0+…` → `release-notes/1.2.0/`). Sans elles, le build s'arrête avant de construire.

- 500 caractères au plus (limite de Google Play), texte brut, une puce `•` par nouveauté.
- Ce que le voyageur ou l'équipe voit changer, pas la technique.
- Envoyées à Google Play (« Nouveautés », fr-FR) et à l'App Store (« Nouveautés de cette version », fr-FR).
