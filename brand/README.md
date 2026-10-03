# Identité visuelle — logo (option E-A, retenue le 03/10/2026)

Le logo est un **panneau** : le nom « Plazo » en lettres grasses sans empattement (Inter, graisse 800,
resserrées comme sur un panneau routier) dans un rectangle prune aux angles arrondis, clin d'œil au
panneau « P » des parkings. Le symbole (icônes, favicon) est ce même panneau réduit à son « P ».
Les glyphes sont convertis en tracés : les fichiers SVG n'ont besoin d'aucune police.

Le nom du produit reste dans `product.json` (seul endroit) : si le nom change, régénérer le dossier
(voir « Régénérer » plus bas) ; le panneau est le seul autre endroit où il apparaît, sous forme de tracé.

## Fichiers

| Fichier | Usage |
|---|---|
| `logo-horizontal-light.svg` | Le panneau sur fond clair : rectangle prune, lettres blanches. |
| `logo-horizontal-dark.svg` | Le panneau sur fond sombre (prune, noir) : rectangle blanc, lettres prune. |
| `logo-mono.svg` | Une seule couleur (prune) pour l'impression, la gravure, le fax : les lettres sont évidées. Changer la couleur en remplaçant `#4b164c`. |
| `symbol.svg` / `symbol-dark.svg` / `symbol-mono.svg` | Le symbole seul (carré + P), fond clair / fond sombre / une couleur. |
| `wordmark.svg` / `wordmark-dark.svg` | Les lettres seules, sans le panneau, prune / blanches (titres de documents). |
| `app/` | **Le logo de l'app mobile**, qui garde l'option L-B (choix du 03/10/2026) : monogramme « P » Playfair avec l'avion en papier **orange easyJet `#FF6600`** (O-A), mot-symbole Playfair italique ; icône d'app **orange plein, P blanc, avion prune** (O-B). Générateurs `app/tools/build_svg.py` et `app/tools/export_png.mjs`. |
| `favicon.svg`, `favicon-32.png`, `favicon-180.png` | Favicon (SVG moderne, 32 px de secours, 180 px pour l'icône Apple « touch »). |
| `icon-192.png`, `icon-512.png` (`icon-maskable.svg`) | Icônes de manifeste web **maskable** : fond prune plein-pan, glyphes dans le cercle de sûreté (80 %). |
| `android-foreground.svg` | Couche avant de l'icône adaptative Android (glyphes dans les 66 % centraux, fond transparent). |
| `social-card.svg`, `png/social-card-1200x630.png` | Carte de partage (Open Graph / Twitter), logo sombre sur prune. |
| `png/logo-horizontal-*@1x/2x/4x.png` | Exports du logo (232 × 100, 464 × 200, 928 × 400), fond transparent. |
| `png/symbol-512.png`, `png/symbol-1024.png`, `png/symbol-dark-512.png` | Exports du symbole. |
| `png/app-icon-1024.png`, `png/android-foreground-1024.png` | Sources de l'icône d'app (flutter_launcher_icons). |
| `tools/build_svg.py`, `tools/export_png.mjs` | Générateurs (voir « Régénérer »). |

Copies dans le code : `site/public/brand/`, `site/src/app/icon.svg`, `site/src/app/apple-icon.png`,
`admin/public/`, `admin/src/assets/` ; pour l'app mobile, depuis `brand/app/` : `mobile/assets/brand/`, `mobile/web/favicon.png`. Les icônes natives
(`mobile/android/.../mipmap-*`, `mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset`) sont générées par
`dart run flutter_launcher_icons` depuis `mobile/pubspec.yaml`.

## Couleurs

| Nom | Hex | Usage |
|---|---|---|
| Prune | `#4b164c` | Le panneau sur fond clair, les lettres sur fond sombre, fonds de marque. |
| Blanc | `#ffffff` | Les lettres sur fond clair ; le panneau sur fond sombre. |
| Pêche | `#f0a36b` | Couleur d'accent de l'app et du site ; jamais sur le logo lui-même. |
| Prune profond | `#2c0f31` | Fond du pied de page du site (variante sombre du logo dessus). |
| Noir espace pro | `#0B0B0C` | Fond de l'espace pro (variante sombre du logo dessus). |

Sur fond prune ou noir : variante *dark* uniquement. Sur fond blanc ou très clair : variante *light*.
Sur une photo ou un fond coloré sans garantie de contraste : poser le logo dans un cartouche blanc ou prune.

## Construction et espace de protection

- Le panneau fait 100 unités de haut, angles de rayon 17 (17 % de la hauteur) ; sa largeur suit le nom
  (232 unités pour « Plazo ») : 24 unités de marge de chaque côté des lettres.
- Lettres : hauteur de capitale 56, centrées verticalement (de 22 à 78), interlettrage −3 % de cadratin.
- Symbole : carré de 100, mêmes angles, le « P » en hauteur de capitale 58, centré.
- Espace de protection : au minimum **la moitié de la hauteur du panneau** (50 unités) tout autour ; rien
  (texte, autre logo, bord) n'entre dans cette zone.
- Alignement : par les bords du panneau (c'est un bloc), jamais par la ligne de base des lettres.

## Tailles minimales

| Forme | Écran | Impression |
|---|---|---|
| Panneau | 20 px de haut (le mot reste lisible) ; 28–36 px dans les en-têtes | 7 mm de haut |
| Symbole seul | 16 px (favicon) | 6 mm |
| Lettres seules | 20 px de haut | 6 mm |

## À faire / à ne pas faire

- Utiliser les fichiers tels quels ; ne pas recomposer le logo avec la police dans un document.
- Ne pas changer les proportions du panneau ni les marges autour des lettres.
- Ne pas étirer, incliner, ajouter d'ombre, de contour ou de dégradé au symbole.
- Ne pas recolorer : prune et blanc, ou une seule couleur (variante *mono*). Jamais le dégradé
  violet → rose → pêche des boutons sur le logo lui-même.
- Ne pas poser la variante *light* sur un fond sombre ni la *dark* sur un fond clair.
- Le symbole seul suffit pour les icônes, avatars et favicons ; les lettres seules pour les titres de documents.
- Dans l'espace pro, le suffixe « Pro » est un texte à côté du logo, jamais intégré au fichier.

## Régénérer

```bash
pip install fonttools uharfbuzz
python3 brand/tools/build_svg.py                       # SVG (nom lu dans product.json, police Inter de mobile/assets/fonts)
node brand/tools/export_png.mjs <playwright> <chromium> # PNG, favicons, carte sociale
# puis recopier les fichiers dans site/, admin/, mobile/ (liste ci-dessus) et `dart run flutter_launcher_icons`
```

Police : Inter (SIL Open Font License, `mobile/assets/fonts/OFL-Inter.txt`).
