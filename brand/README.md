# Identité visuelle — logo (option L-B, retenue le 03/10/2026)

Le logo est un monogramme : un carré arrondi prune contenant un « P » (Playfair Display, graisse 500),
clin d'œil au panneau « P » des parkings, d'où décolle un petit avion en papier pêche ; le mot-symbole
« Plazo » en Playfair Display italique (graisse 500) est placé à droite, aligné sur la ligne de base du P.
Les glyphes sont convertis en tracés : les fichiers SVG n'ont besoin d'aucune police.

Le nom du produit reste dans `product.json` (seul endroit) : si le nom change, régénérer le dossier
(voir « Régénérer » plus bas) ; le mot-symbole est le seul autre endroit où il apparaît, sous forme de tracé.

## Fichiers

| Fichier | Usage |
|---|---|
| `logo-horizontal-light.svg` | Logo complet sur fond clair : carré prune, P blanc, mot-symbole prune. |
| `logo-horizontal-dark.svg` | Logo complet sur fond sombre (prune, noir) : carré blanc, P prune, mot-symbole blanc. |
| `logo-mono.svg` | Une seule couleur (prune) pour l'impression, la gravure, le fax : le P et l'avion sont évidés. Changer la couleur en remplaçant `#4b164c`. |
| `symbol.svg` / `symbol-dark.svg` / `symbol-mono.svg` | Le symbole seul (carré + P + avion), fond clair / fond sombre / une couleur. |
| `wordmark.svg` | Le mot-symbole seul, prune. |
| `favicon.svg`, `favicon-32.png`, `favicon-180.png` | Favicon (SVG moderne, 32 px de secours, 180 px pour l'icône Apple « touch »). |
| `icon-192.png`, `icon-512.png` (`icon-maskable.svg`) | Icônes de manifeste web **maskable** : fond prune plein-pan, glyphes dans le cercle de sûreté (80 %). |
| `android-foreground.svg` | Couche avant de l'icône adaptative Android (glyphes dans les 66 % centraux, fond transparent). |
| `social-card.svg`, `png/social-card-1200x630.png` | Carte de partage (Open Graph / Twitter), logo sombre sur prune. |
| `png/logo-horizontal-*@1x/2x/4x.png` | Exports du logo (317 × 100, 634 × 200, 1268 × 400), fond transparent. |
| `png/symbol-512.png`, `png/symbol-1024.png`, `png/symbol-dark-512.png` | Exports du symbole. |
| `png/app-icon-1024.png`, `png/android-foreground-1024.png` | Sources de l'icône d'app (flutter_launcher_icons). |
| `tools/build_svg.py`, `tools/export_png.mjs` | Générateurs (voir « Régénérer »). |

Copies dans le code : `site/public/brand/`, `site/src/app/icon.svg`, `site/src/app/apple-icon.png`,
`admin/public/`, `admin/src/assets/`, `mobile/assets/brand/`, `mobile/web/favicon.png`. Les icônes natives
(`mobile/android/.../mipmap-*`, `mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset`) sont générées par
`dart run flutter_launcher_icons` depuis `mobile/pubspec.yaml`.

## Couleurs

| Nom | Hex | Usage |
|---|---|---|
| Prune | `#4b164c` | Carré du symbole, mot-symbole sur fond clair, fonds de marque. |
| Blanc | `#ffffff` | P sur fond clair ; carré et mot-symbole sur fond sombre. |
| Pêche | `#f0a36b` | L'avion, dans toutes les variantes en couleur. |
| Prune profond | `#2c0f31` | Fond du pied de page du site (variante sombre du logo dessus). |
| Noir espace pro | `#0B0B0C` | Fond de l'espace pro (variante sombre du logo dessus). |

Sur fond prune ou noir : variante *dark* uniquement. Sur fond blanc ou très clair : variante *light*.
Sur une photo ou un fond coloré sans garantie de contraste : poser le logo dans un cartouche blanc ou prune.

## Construction et espace de protection

- Le symbole est un carré de 100 unités, rayon des angles 22 (22 % du côté).
- Le P occupe 52 unités de hauteur de capitale, centré (ligne de base à 76) ; l'avion décolle du coin
  supérieur droit de la panse et reste dans le carré.
- Mot-symbole : hauteur de capitale 58, même ligne de base que le P, espace de 20 unités après le carré.
- Espace de protection : au minimum **la moitié du côté du carré** (50 unités) tout autour du logo ; rien
  (texte, autre logo, bord) n'entre dans cette zone.
- Alignement : le logo s'aligne par la ligne de base du P / du mot-symbole et par le bord gauche du carré.

## Tailles minimales

| Forme | Écran | Impression |
|---|---|---|
| Logo horizontal | 24 px de haut (le mot reste lisible) ; 28–36 px dans les en-têtes | 8 mm de haut |
| Symbole seul | 16 px (favicon : l'avion devient un point, c'est prévu) | 6 mm |
| Mot-symbole seul | 20 px de haut | 6 mm |

## À faire / à ne pas faire

- Utiliser les fichiers tels quels ; ne pas recomposer le logo avec la police dans un document.
- Ne pas changer les proportions, l'angle de l'avion, ni l'espacement symbole / mot.
- Ne pas étirer, incliner, ajouter d'ombre, de contour ou de dégradé au symbole.
- Ne pas recolorer : prune, blanc, pêche, ou une seule couleur (variante *mono*). Jamais le dégradé
  violet → rose → pêche des boutons sur le logo lui-même.
- Ne pas poser la variante *light* sur un fond sombre ni la *dark* sur un fond clair.
- Le symbole seul suffit pour les icônes, avatars et favicons ; le mot-symbole seul pour les titres de documents.
- Dans l'espace pro, le suffixe « Pro » est un texte à côté du logo, jamais intégré au fichier.

## Régénérer

```bash
pip install fonttools uharfbuzz
python3 brand/tools/build_svg.py                       # SVG (nom lu dans product.json, polices de mobile/assets/fonts)
node brand/tools/export_png.mjs <playwright> <chromium> # PNG, favicons, carte sociale
# puis recopier les fichiers dans site/, admin/, mobile/ (liste ci-dessus) et `dart run flutter_launcher_icons`
```

Polices : Playfair Display (SIL Open Font License, `mobile/assets/fonts/OFL-PlayfairDisplay.txt`).
