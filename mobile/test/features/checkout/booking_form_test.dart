import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/booking/data/models/public_booking_model.dart';
import 'package:parking_app/src/features/booking/domain/repositories/booking_repository.dart';
import 'package:parking_app/src/features/booking/domain/usecases/booking_actions_use_cases.dart';
import 'package:parking_app/src/features/checkout/domain/booking_draft.dart';
import 'package:parking_app/src/features/checkout/presentation/bloc/booking_form_bloc.dart';
import 'package:parking_app/src/features/checkout/presentation/pages/booking_form_page.dart';
import 'package:parking_app/src/features/search/domain/repositories/public_repository.dart';
import 'package:parking_app/src/features/search/domain/usecases/public_use_cases.dart';
import 'package:parking_app/src/services/link_service.dart';
import 'package:parking_app/src/services/secure_storage_service.dart';

import '../../helpers/fakes.dart';
import '../../helpers/pump_app.dart';

const valid = BookingDraft(
  customerName: 'Camille Martin',
  customerPhone: '06 12 34 56 78',
  customerEmail: 'camille@exemple.fr',
  plate: 'gk318px',
  returnFlight: 'to 3627',
  passengers: 2,
  acceptTerms: true,
);

void main() {
  setUpAll(setUpLocalizedTests);

  late InMemorySecureStorageService storage;
  late FakeBookingDataSource api;
  late FakePublicDataSource public;
  late BookingDraftStore drafts;

  BookingFormBloc makeBloc() => BookingFormBloc(
    GetParkingUseCase(PublicRepositoryImpl(public)),
    CreateBookingUseCase(BookingRepositoryImpl(api)),
    drafts,
    airport: 'lyon-saint-exupery',
    parking: 'parking-demo-lys',
    arrivalAt: '2026-10-03T08:00',
    returnAt: '2026-10-10T18:00',
    idempotencyKey: 'a' * 32,
  );

  setUp(() {
    storage = InMemorySecureStorageService();
    api = FakeBookingDataSource(storage);
    public = FakePublicDataSource();
    drafts = BookingDraftStore();
  });

  group('« Vos informations » : mêmes contrôles que l’API', () {
    test('champs obligatoires, nom, téléphone, email, plaque, vol, conditions', () {
      expect(validateBookingDraft(valid), isEmpty);
      expect(validateBookingDraft(const BookingDraft()), {
        'customerName': 'required',
        'customerPhone': 'required',
        'customerEmail': 'required',
        'plate': 'required',
        'acceptTerms': 'terms_required',
      });
      const bad = BookingDraft(
        customerName: 'www.example.com',
        customerPhone: 'appelez-moi',
        customerEmail: 'camille@',
        plate: 'AB/12',
        returnFlight: 'TO 3627 TO 3627',
        passengers: 10,
        acceptTerms: true,
      );
      expect(validateBookingDraft(bad), {
        'customerName': 'invalid_name',
        'customerPhone': 'invalid_phone',
        'customerEmail': 'invalid_email',
        'plate': 'invalid_plate',
        'returnFlight': 'invalid_flight',
        'passengers': 'passengers_range',
      });
      // Accents, apostrophes, hyphens, foreign plates: fine.
      expect(validateBookingDraft(const BookingDraft(
        customerName: 'Jean-Luc O’Neil',
        customerPhone: '+44 20 7946 0958',
        customerEmail: 'jl@exemple.co.uk',
        plate: 'B 1234 XY',
        acceptTerms: true,
      )), isEmpty);
    });

    test('envoi : plaque formatée, vol en capitales, clé d’idempotence ; jamais de prix', () async {
      api.answer('create', CreatedBookingModel(reference: 'R7KQ2M', manageToken: 't', booking: booking(status: 'pending_payment', paymentMode: 'online')));
      final bloc = makeBloc()..add(const BookingFormStarted());
      await bloc.stream.firstWhere((s) => s.parkingResponse != null);
      expect((bloc.state.online, bloc.state.priceCents, bloc.state.days), (true, 4500, 8));
      bloc.add(const BookingFormSubmitted(valid));
      final s = await bloc.stream.firstWhere((s) => s.created != null);
      final body = api.lastInput!.toJson();
      expect(body, containsPair('plate', 'GK-318-PX'));
      expect(body, containsPair('returnFlight', 'TO 3627'));
      expect(body, containsPair('idempotencyKey', 'a' * 32));
      expect(body.keys, isNot(contains('priceCents')));
      expect(s.created!.booking.status, 'pending_payment');
      // Kept for "Modifier" until it is paid; the manage token is on the phone.
      expect(drafts.draft?.customerName, 'Camille Martin');
      expect(await storage.bookingToken('R7KQ2M'), 't');
      await bloc.close();
    });

    test('paiement désactivé : confirmée tout de suite (sur place), brouillon oublié', () async {
      public.parking_ = parkingResponse(payment: 'on_site');
      api.answer('create', CreatedBookingModel(reference: 'R7KQ2M', manageToken: 't', booking: booking()));
      final bloc = makeBloc()..add(const BookingFormStarted());
      await bloc.stream.firstWhere((s) => s.parkingResponse != null);
      expect(bloc.state.online, isFalse);
      bloc.add(const BookingFormSubmitted(valid));
      expect((await bloc.stream.firstWhere((s) => s.created != null)).created!.booking.status, 'upcoming');
      expect(drafts.draft, isNull);
      await bloc.close();
    });

    test('erreurs de l’API : par champ, et complet avec les nuits', () async {
      api
        ..answer('create', const ApiError('validation_failed', fields: {'customerPhone': 'invalid_phone'}))
        ..answer('create', const ApiError('overbooked', details: {'fullNights': ['2026-10-05']}));
      final bloc = makeBloc()..add(const BookingFormStarted());
      await bloc.stream.firstWhere((s) => s.parkingResponse != null);
      bloc.add(const BookingFormSubmitted(valid));
      final fields = await bloc.stream.firstWhere((s) => s.submitState.index == 3);
      expect(fields.fieldErrors, {'customerPhone': 'invalid_phone'});
      bloc.add(const BookingFormSubmitted(valid));
      final full = await bloc.stream.firstWhere((s) => s.errorCode == 'overbooked');
      expect(full.unavailable, isTrue);
      expect(full.fullNights, ['2026-10-05']);
      await bloc.close();
    });
  });

  group('écran « Vos informations »', () {
    setUp(() => locator.registerSingleton<LinkService>(FakeLinks()));
    tearDown(locator.reset);

    Future<BookingFormBloc> pump(WidgetTester tester) async {
      final bloc = makeBloc()..add(const BookingFormStarted());
      addTearDown(bloc.close);
      await pumpLocalized(tester, BlocProvider.value(value: bloc, child: const BookingFormView()), size: const Size(400, 1600));
      await tester.pumpAndSettle();
      return bloc;
    }

    testWidgets('étapes, récapitulatif, champs du site ; erreurs en français sous chaque champ', (tester) async {
      await pump(tester);
      expect(find.text('1 · Vos informations'), findsOneWidget);
      expect(find.text('2 · Paiement'), findsOneWidget);
      expect(find.text('Parking Démo LYS'), findsOneWidget);
      expect(find.text('45,00 €'), findsOneWidget);
      for (final label in ['Prénom et nom', 'Téléphone mobile (pour le SMS de la navette)', 'Email (confirmation)', 'Plaque d\'immatriculation', 'Vol retour (conseillé)', 'Passagers']) {
        expect(find.text(label), findsWidgets, reason: label);
      }
      expect(find.text('Plaque française ou étrangère.'), findsOneWidget);
      await tester.tap(find.text('Continuer vers le paiement'));
      await tester.pumpAndSettle();
      expect(find.text('Certains champs sont à corriger.'), findsOneWidget);
      expect(find.text('Champ obligatoire.'), findsNWidgets(4));
      expect(find.text('Merci d\'accepter les conditions pour réserver.'), findsOneWidget);
      expect(api.calls, isNot(contains('create')));
    });

    testWidgets('erreur d’un champ renvoyée par le serveur, traduite', (tester) async {
      api.answer('create', const ApiError('validation_failed', fields: {'customerName': 'invalid_name'}));
      await pump(tester);
      await tester.enterText(find.byKey(const Key('field-name')), 'Camille Martin');
      await tester.enterText(find.byKey(const Key('field-phone')), '0612345678');
      await tester.enterText(find.byKey(const Key('field-email')), 'camille@exemple.fr');
      await tester.enterText(find.descendant(of: find.byKey(const Key('field-plate')), matching: find.byType(TextField)), 'gk318px');
      await tester.tap(find.byKey(const Key('field-terms')));
      await tester.pump();
      expect(find.text('Plaque française reconnue.'), findsOneWidget);
      await tester.tap(find.text('Continuer vers le paiement'));
      await tester.pumpAndSettle();
      expect(api.calls, contains('create'));
      expect(find.text('Indiquez votre prénom et votre nom (lettres, espaces, apostrophes et tirets).'), findsOneWidget);
    });

    testWidgets('paiement sur place : section « Paiement sur place », « Confirmer la réservation »', (tester) async {
      public.parking_ = parkingResponse(payment: 'on_site');
      await pump(tester);
      expect(find.text('1 · Vos informations'), findsNothing);
      expect(find.text('Paiement sur place'), findsOneWidget);
      expect(find.text('Confirmer la réservation'), findsOneWidget);
    });
  });
}
