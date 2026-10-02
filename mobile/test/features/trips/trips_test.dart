import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/core/enums/view_state.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/booking/data/models/public_booking_model.dart';
import 'package:parking_app/src/features/booking/domain/repositories/booking_repository.dart';
import 'package:parking_app/src/features/booking/domain/usecases/booking_actions_use_cases.dart';
import 'package:parking_app/src/features/booking/domain/usecases/get_booking_use_case.dart';
import 'package:parking_app/src/features/booking/domain/usecases/lookup_booking_use_case.dart';
import 'package:parking_app/src/features/booking/domain/usecases/save_booking_access_use_case.dart';
import 'package:parking_app/src/features/booking/domain/usecases/saved_bookings_use_case.dart';
import 'package:parking_app/src/features/booking/presentation/bloc/booking_bloc.dart';
import 'package:parking_app/src/features/trips/presentation/bloc/manage_booking_bloc.dart';
import 'package:parking_app/src/features/trips/presentation/bloc/trips_bloc.dart';
import 'package:parking_app/src/features/trips/presentation/widgets/add_booking_sheet.dart';
import 'package:parking_app/src/features/trips/presentation/widgets/booking_actions.dart';
import 'package:parking_app/src/features/trips/presentation/widgets/trip_card.dart';
import 'package:parking_app/src/services/link_service.dart';
import 'package:parking_app/src/services/secure_storage_service.dart';

import '../../helpers/fakes.dart';
import '../../helpers/pump_app.dart';

/// 12:00 in Paris on Saturday 3 October 2026.
final now = DateTime.utc(2026, 10, 3, 10);

void main() {
  setUpAll(setUpLocalizedTests);

  late InMemorySecureStorageService storage;
  late FakeBookingDataSource api;
  late BookingRepositoryImpl repo;

  setUp(() {
    storage = InMemorySecureStorageService();
    api = FakeBookingDataSource(storage);
    repo = BookingRepositoryImpl(api);
  });

  Future<void> keep(PublicBookingModel b) async {
    await storage.saveBookingToken(b.reference, 'token-${b.reference}');
    api.bookings[b.reference] = b;
  }

  group('réservations gardées sur le téléphone (sans compte)', () {
    test('lues de l’API, À venir / Passées, prochain départ ; un lien expiré est retiré du téléphone', () async {
      await keep(booking(reference: 'RLATER', arrivalAt: '2026-10-24T08:00', returnAt: '2026-10-25T18:00'));
      await keep(booking(reference: 'RTODAY', arrivalAt: '2026-10-03T14:00', returnAt: '2026-10-10T18:00'));
      await keep(booking(reference: 'RDONE', status: 'returned', arrivalAt: '2026-09-20T08:00', returnAt: '2026-09-27T18:00'));
      await keep(booking(reference: 'RGONE', status: 'cancelled', arrivalAt: '2026-10-12T08:00', returnAt: '2026-10-14T18:00'));
      await storage.saveBookingToken('ROLD', 'token-old'); // 30 days after its return: 404
      final bloc = TripsBloc(LoadSavedBookingsUseCase(repo), clock: () => now)..add(const TripsLoaded());
      final s = await bloc.stream.firstWhere((s) => s.loadState.isSuccess);
      expect(s.upcoming.map((b) => b.reference), ['RTODAY', 'RLATER']);
      expect(s.past.map((b) => b.reference), ['RGONE', 'RDONE']);
      expect(s.nextDeparture?.reference, 'RTODAY');
      expect(await storage.bookingReferences(), isNot(contains('ROLD')));
      expect(await storage.bookingToken('RTODAY'), 'token-RTODAY');

      // A change elsewhere (cancelled in a sheet) replaces it in the list.
      bloc.add(TripsBookingChanged(booking(reference: 'RTODAY', status: 'cancelled', arrivalAt: '2026-10-03T14:00')));
      expect((await bloc.stream.first).upcoming.map((b) => b.reference), ['RLATER']);
      await bloc.close();
    });

    test('hors ligne : message plutôt qu’une liste vide', () async {
      await storage.saveBookingToken('RNET', 't');
      api.answer('get', const ApiError('server_error', status: 503));
      final bloc = TripsBloc(LoadSavedBookingsUseCase(repo), clock: () => now)..add(const TripsLoaded());
      final s = await bloc.stream.firstWhere((s) => s.loadState.isError);
      expect(s.bookings, isEmpty);
      expect(await storage.bookingReferences(), ['RNET']);
      await bloc.close();
    });
  });

  group('« Ajouter une réservation » (référence + email, comme « Ma réservation » du site)', () {
    BookingBloc lookupBloc() => BookingBloc(LookupBookingUseCase(repo), GetBookingUseCase(repo), SaveBookingAccessUseCase(repo), SavedBookingsUseCase(repo));

    testWidgets('champs obligatoires, réservation introuvable, puis trouvée : le jeton est gardé', (tester) async {
      api.bookings['R7KQ2M'] = booking();
      String? added;
      final bloc = lookupBloc();
      addTearDown(bloc.close);
      await pumpLocalized(
        tester,
        Builder(
          builder: (context) => Scaffold(
            body: TextButton(
              onPressed: () async => added = await showModalBottomSheet<String>(
                context: context,
                isScrollControlled: true,
                builder: (_) => BlocProvider.value(value: bloc, child: const AddBookingForm()),
              ),
              child: const Text('ajouter'),
            ),
          ),
        ),
      );
      await tester.tap(find.text('ajouter'));
      await tester.pumpAndSettle();
      expect(find.text('Ajouter une réservation'), findsOneWidget);
      await tester.tap(find.byKey(const Key('add-submit')));
      await tester.pump();
      expect(find.text('Champ obligatoire'), findsNWidgets(2));

      await tester.enterText(find.byKey(const Key('add-reference')), 'r7kq2m');
      await tester.enterText(find.byKey(const Key('add-email')), 'autre@exemple.fr');
      await tester.tap(find.byKey(const Key('add-submit')));
      await tester.pumpAndSettle();
      expect(find.textContaining('Réservation introuvable'), findsOneWidget);

      await tester.enterText(find.byKey(const Key('add-email')), 'camille@exemple.fr');
      await tester.tap(find.byKey(const Key('add-submit')));
      await tester.pumpAndSettle();
      expect(added, 'R7KQ2M');
      expect(await storage.bookingToken('R7KQ2M'), 'token-lookup');
    });
  });

  group('carte d’une réservation (A5)', () {
    late FakeLinks links;
    setUp(() {
      links = FakeLinks();
      locator
        ..registerSingleton<LinkService>(links)
        ..registerSingleton<TripsBloc>(TripsBloc(LoadSavedBookingsUseCase(repo), clock: () => now))
        ..registerFactory(() => ManageBookingBloc(UpdateFlightUseCase(repo), CancelBookingUseCase(repo)));
    });
    tearDown(locator.reset);

    Future<void> pump(WidgetTester tester, PublicBookingModel b) =>
        pumpLocalized(tester, Scaffold(body: Padding(padding: const EdgeInsets.all(16), child: TripCard(booking: b, now: now))));

    testWidgets('le jour du dépôt : « Je suis en route », statut, plaque, actions', (tester) async {
      await pump(tester, booking(arrivalAt: '2026-10-03T14:00', paymentMode: 'online', payment: const BookingPaymentModel(status: 'paid')));
      expect(find.text('Confirmée · payée'), findsOneWidget);
      expect(find.text('Je suis en route'), findsOneWidget);
      expect(find.textContaining('Dépôt aujourd\'hui 14:00'), findsOneWidget);
      expect(find.text('AB-123-CD'), findsOneWidget);
      for (final a in ['Modifier le vol', 'Itinéraire', 'Annuler']) {
        expect(find.text(a), findsOneWidget);
      }
      await tester.tap(find.text('Itinéraire'));
      expect(links.opened.single.host, 'www.google.com');
    });

    testWidgets('plus tard : « Dans 3 semaines », pas de « Je suis en route »', (tester) async {
      await pump(tester, booking(arrivalAt: '2026-10-24T08:00', returnAt: '2026-10-25T18:00'));
      expect(find.text('Dans 3 semaines'), findsOneWidget);
      expect(find.text('Je suis en route'), findsNothing);
    });

    testWidgets('en attente de paiement : « Finaliser le paiement », ni itinéraire ni annulation', (tester) async {
      await pump(tester, booking(status: 'pending_payment', paymentMode: 'online', canCancel: false, canEditFlight: false));
      expect(find.text('Finaliser le paiement'), findsOneWidget);
      expect(find.text('Itinéraire'), findsNothing);
      expect(find.text('Annuler'), findsNothing);
    });

    testWidgets('annuler : conditions et remboursement comme le site, puis annulée', (tester) async {
      await pump(tester, booking(paymentMode: 'online', payment: const BookingPaymentModel(status: 'paid')));
      await tester.tap(find.text('Annuler'));
      await tester.pumpAndSettle();
      expect(find.text('Gratuit jusqu\'au ven. 9 oct. à 08:00 : remboursement intégral sur votre carte sous 5 à 10 jours.'), findsOneWidget);
      await tester.tap(find.byKey(const Key('cancel-confirm')));
      await tester.pumpAndSettle();
      expect(api.calls, contains('cancel'));
      expect(find.byType(CancelSheet), findsNothing);
    });

    testWidgets('annulation fermée : le délai, et le téléphone du parking', (tester) async {
      await pump(tester, booking(canCancel: false));
      await tester.tap(find.text('Annuler'));
      await tester.pumpAndSettle();
      expect(find.text('Le délai d\'annulation en ligne est passé (ven. 9 oct. à 08:00). Contactez le parking au 04 72 00 00 00.'), findsOneWidget);
      expect(find.byKey(const Key('cancel-confirm')), findsNothing);
    });

    testWidgets('modifier le vol : erreur du serveur traduite, puis enregistré', (tester) async {
      api
        ..answer('flight', const ApiError('validation_failed', fields: {'returnFlight': 'invalid_flight'}))
        ..answer('flight', booking(returnFlight: 'TO 3627'));
      await pump(tester, booking());
      await tester.tap(find.text('Modifier le vol'));
      await tester.pumpAndSettle();
      await tester.enterText(find.byKey(const Key('flight-field')), '??');
      await tester.tap(find.byKey(const Key('flight-save')));
      await tester.pumpAndSettle();
      expect(find.text('Numéro de vol invalide (ex. TO 3627).'), findsOneWidget);
      await tester.enterText(find.byKey(const Key('flight-field')), 'to 3627');
      await tester.tap(find.byKey(const Key('flight-save')));
      await tester.pumpAndSettle();
      expect(find.byType(FlightSheet), findsNothing);
    });
  });
}
