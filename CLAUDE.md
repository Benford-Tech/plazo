# Projet : Plazo (nom de travail, à confirmer) — logiciel pour opérateurs de parkings d'aéroport

## Contexte

Logiciel SaaS pour les opérateurs de parkings privés situés autour des aéroports
(parkings avec navette gratuite vers les terminaux, parfois voiturier). Premier marché :
aéroport Lyon Saint-Exupéry. Un premier client (client n°1) est déjà engagé.

Positionnement en deux phases (voir SPEC.md, section 3 bis) :
- **Phase 1 (MVP, à construire maintenant)** : un outil POUR L'OPÉRATEUR, avec sa propre page de
  réservation. Ses clients réservent sur sa page, il gère tout depuis un seul espace.
- **Phase 2 (plus tard)** : place de marché grand public (recherche, comparaison, paiement en ligne,
  commission, plusieurs loueurs). À ne lancer que quand 3 à 5 loueurs sont actifs sur un même aéroport.
  Ne pas la construire pendant le MVP, mais concevoir le modèle de données multi-opérateurs dès le départ.

Le métier de ces opérateurs :
- recevoir des réservations par plusieurs canaux (site propre, comparateurs, téléphone) ;
- accueillir le client à l'aller, garer le véhicule (le client ou un voiturier), conduire le client au terminal en navette ;
- récupérer le client au retour (aujourd'hui souvent : le client appelle le parking à l'atterrissage, attentes parfois longues) ;
- restituer le véhicule, encaisser, gérer les litiges (rayures, dégâts) ;
- parfois des services annexes : lavage, plein, recharge électrique.

## Client n°1 — À COMPLÉTER AVANT DE CODER

- Nom / parking :
- Capacité (places) :
- Navettes / chauffeurs :
- Voituriers qui déplacent les véhicules (clés confiées) OU clients qui se garent eux-mêmes ? :
- Réservations par jour (moyenne / pic) :
- Canaux de réservation actuels :
- Outil actuel (logiciel, Excel, papier) :
- Sa douleur n°1 (avec ses mots) :
- Prix convenu et date attendue de la première version :

## Périmètre du MVP : trois blocs

Ne construire QUE ce qui règle la douleur n°1 du client.

1. **Réservations**
   - Saisie manuelle (téléphone, comptoir) + import des réservations des autres canaux
     (au départ : import CSV / copier-coller de mails de confirmation ; connecteurs plus tard).
   - Page de réservation propre à l'opérateur (formulaire simple, confirmation par mail/SMS).
   - Vue planning : arrivées et retours du jour, taux d'occupation, alerte de surréservation
     calculée sur la capacité réelle.
   - Fiche réservation : client, téléphone, plaque, dates/heures, n° de vol retour, nb de passagers, statut.

2. **Plan du parking et affectation des véhicules**
   - Plan configurable : zones, rangées, places.
   - Affectation de chaque véhicule à un emplacement à l'arrivée.
   - Aide au rangement par date de retour (éviter qu'un véhicule soit bloqué derrière un autre).
   - Retrouver un véhicule en quelques secondes (plaque, emplacement, emplacement des clés).
   - Si voiturier : suivi des clés confiées.

3. **Navette au retour**
   - N° de vol retour saisi à la réservation.
   - Suivi de l'heure d'atterrissage réelle (API de suivi de vols, à choisir).
   - File des clients à récupérer, triée par heure d'arrivée, pour le chauffeur (vue mobile).
   - SMS au client au moment de l'atterrissage (point de rendez-vous, délai).

## Liste « plus tard » (le « bien plus »), hors MVP

État des lieux photo, lecture de plaque, tarification dynamique,
connecteurs agrégateurs (Parkos, ParkMundo, Onepark, Free2move…), multi-parkings,
statistiques et facturation. Le paiement en ligne arrive au jalon 3 de la page du loueur,
puis la commission et les reversements en phase 2 (place de marché ouverte aux voyageurs).

## Concurrence à connaître avant de coder

- **ParkFlow** : système de gestion de réservations spécialisé parkings d'aéroport
  (agrège les canaux, intégrations paiement, facturation, barrières). À comparer : tarifs,
  ce qu'il ne fait pas (suivi de vol, file de navettes au retour, plan des places).
- Autres : ParkAlto (hors-aéroport), O-Valet (voiturier, suivi de vols), netPark, SMS Valet.

## Stack — À DÉCIDER

- Front web / back :
- App mobile native : Flutter (deux apps à terme via les flavors : « pro » et « voyageur »)
- Base de données :
- Hébergement :
- SMS :
- API de suivi de vols :

Deux clients, un seul back-end :
- **Application web** : espace pro (gérant, agents) et page de réservation propre au loueur.
- **Application mobile native** (App Store et Google Play), dès le MVP, pour trois publics :
  personnel du parking (chauffeur, agent, voiturier), gérant, voyageurs. Voir SPEC.md, section 3 ter.
  À terme deux apps (« pro » et « voyageur ») ; on construit d'abord un seul projet Flutter
  avec deux parcours bien séparés dans le code, puis on sépare les points d'entrée.

Contraintes : application web responsive, application mobile native iOS et Android,
interface en français, données personnelles clients → RGPD (minimiser, durée de conservation).
Le nom du produit doit rester dans UN seul fichier de configuration (il peut encore changer).

## Règles de travail

- Livrer par petites étapes utilisables par le client n°1, montrer chaque étape.
- Ne pas ajouter de fonctionnalité hors périmètre sans demande explicite.
- Code et commentaires en anglais, interface et documentation utilisateur en français.
