import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/search/data/models/public_models.dart';
import 'package:parking_app/src/features/search/domain/repositories/public_repository.dart';
import 'package:parking_app/src/features/search/domain/usecases/public_use_cases.dart';
import 'package:parking_app/src/features/search/presentation/bloc/parking/parking_bloc.dart';
import 'package:parking_app/src/features/search/presentation/pages/parking_page.dart';
import 'package:parking_app/src/services/link_service.dart';

import '../../helpers/fakes.dart';
import '../../helpers/pump_app.dart';

void main() {
  setUpAll(setUpLocalizedTests);
  late FakeLinks links;
  setUp(() {
    links = FakeLinks();
    locator.registerSingleton<LinkService>(links);
  });
  tearDown(locator.reset);

  Future<void> pump(WidgetTester tester, ParkingResponseModel response, {bool dates = true}) async {
    final api = FakePublicDataSource()..parking_ = response;
    final bloc = ParkingBloc(
      GetParkingUseCase(PublicRepositoryImpl(api)),
      airport: 'lyon-saint-exupery',
      slug: 'parking-demo-lys',
      arrivalAt: dates ? '2026-10-03T08:00' : null,
      returnAt: dates ? '2026-10-10T18:00' : null,
    )..add(const ParkingRequested());
    addTearDown(bloc.close);
    await pumpLocalized(tester, BlocProvider.value(value: bloc, child: const ParkingPage(airport: 'lyon-saint-exupery', parking: 'parking-demo-lys')));
    await tester.pumpAndSettle();
  }

  testWidgets('réservable : faits, sections du site, barre « 45,00 € · 3 → 10 oct. · 8 jours » et « Réserver »', (tester) async {
    await pump(tester, parkingResponse());
    // The trust band: shuttle, security, cancellation, keys (self-park: no valet), then the facts line.
    expect(find.text('Navette 8 min'), findsOneWidget);
    expect(find.text('clôturé, vidéosurveillance'), findsOneWidget);
    expect(find.text('Annulation gratuite'), findsOneWidget);
    expect(find.text('jusqu\'à 24 h avant'), findsOneWidget);
    expect(find.text('Vous vous garez'), findsOneWidget);
    expect(find.byKey(const Key('tile-shuttle')), findsOneWidget);
    expect(find.text('À 3,5 km des terminaux · Extérieur'), findsOneWidget);
    expect(find.text('Nouveau sur Plazo'), findsOneWidget);
    expect(find.byKey(const Key('parking-per-day')), findsOneWidget); // 45,00 € ÷ 8 jours
    for (final chip in ['À l\'aller', 'Au retour', 'Accès']) {
      expect(find.widgetWithText(InkWell, chip), findsWidgets);
    }
    expect(find.textContaining('la navette vous dépose au terminal en 8 minutes'), findsOneWidget);
    expect(find.text('45,00 €'), findsOneWidget); // the bar only: the price grid is not shown
    expect(find.text('3 → 10 oct. · 8 jours'), findsOneWidget);
    expect(find.byKey(const Key('parking-book')), findsOneWidget);
    expect(find.text('Réservation en ligne bientôt disponible'), findsNothing);
    expect(find.bySemanticsLabel('Photos du parking à venir'), findsOneWidget);

    // Anchor chips bring their section into view; the itinerary opens the maps app.
    await tester.tap(find.byKey(const Key('anchor-access')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('parking-itinerary')));
    expect(links.opened.single.toString(), contains('google.com/maps/dir/?api=1&destination=12+route'));
  });

  testWidgets('parking de démonstration : étiquette « DÉMO » à côté du titre', (tester) async {
    final response = parkingResponse();
    await pump(tester, response.copyWith(parking: response.parking.copyWith(isDemo: true)));
    expect(find.text('Parking Démo LYS'), findsWidgets);
    expect(find.text('DÉMO'), findsOneWidget);
  });

  testWidgets('pas encore réservable dans l’app : « Réservation en ligne bientôt disponible », pas de « Réserver »', (tester) async {
    await pump(tester, parkingResponse(payment: 'unavailable'));
    expect(find.byKey(const Key('parking-online-soon')), findsOneWidget);
    expect(find.text('Réservation en ligne bientôt disponible'), findsOneWidget);
    expect(find.byKey(const Key('parking-book')), findsNothing);
  });

  testWidgets('complet ou sans tarif : pas de « Réserver », lien vers les autres parkings', (tester) async {
    await pump(tester, parkingResponse(offer: const OfferModel(available: false, days: 8, priceCents: 4500)));
    expect(find.text('Complet à ces dates'), findsOneWidget);
    expect(find.byKey(const Key('parking-book')), findsNothing);
    expect(find.byKey(const Key('parking-other')), findsOneWidget);
  });

  testWidgets('sans dates : « dès 15,00 € » et « Choisir vos dates »', (tester) async {
    await pump(tester, parkingResponse(offer: null), dates: false);
    expect(find.text('dès 15,00 €'), findsOneWidget);
    expect(find.byKey(const Key('parking-choose-dates')), findsOneWidget);
  });
}
