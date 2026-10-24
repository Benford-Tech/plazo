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
import 'package:parking_app/src/features/search/data/models/public_models.dart';
import 'package:parking_app/src/features/search/domain/repositories/public_repository.dart';
import 'package:parking_app/src/features/search/domain/usecases/public_use_cases.dart';
import 'package:parking_app/src/services/link_service.dart';
import 'package:parking_app/src/services/secure_storage_service.dart';
import 'package:parking_app/src/shared/child_seats/child_seats.dart';

import '../../helpers/fakes.dart';
import '../../helpers/pump_app.dart';

const valid = BookingDraft(
  customerFirstName: 'Camille',
  customerLastName: 'Martin',
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

  BookingFormBloc makeBloc({String arrivalAt = '2026-10-03T08:00', String returnAt = '2026-10-10T18:00'}) => BookingFormBloc(
    GetParkingUseCase(PublicRepositoryImpl(public)),
    CreateBookingUseCase(BookingRepositoryImpl(api)),
    drafts,
    airport: 'lyon-saint-exupery',
    parking: 'parking-demo-lys',
    arrivalAt: arrivalAt,
    returnAt: returnAt,
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
        'customerFirstName': 'required',
        'customerLastName': 'required',
        'customerPhone': 'required',
        'customerEmail': 'required',
        'plate': 'required',
        'acceptTerms': 'terms_required',
      });
      const bad = BookingDraft(
        customerFirstName: 'www.example.com',
        customerLastName: 'Martin 3',
        customerPhone: 'appelez-moi',
        customerEmail: 'camille@',
        plate: 'AB/12',
        returnFlight: 'TO 3627 TO 3627',
        passengers: 10,
        acceptTerms: true,
      );
      expect(validateBookingDraft(bad), {
        'customerFirstName': 'invalid_name',
        'customerLastName': 'invalid_name',
        'customerPhone': 'invalid_phone',
        'customerEmail': 'invalid_email',
        'plate': 'invalid_plate',
        'returnFlight': 'invalid_flight',
        'passengers': 'passengers_range',
      });
      // Accents, apostrophes, hyphens, foreign plates: fine.
      expect(validateBookingDraft(const BookingDraft(
        customerFirstName: 'Jean-Luc',
        customerLastName: 'O’Neil de La Tour',
        customerPhone: '+44 20 7946 0958',
        customerEmail: 'jl@exemple.co.uk',
        plate: 'B 1234 XY',
        acceptTerms: true,
      )), isEmpty);
    });

    test('prénom et nom : chacun obligatoire, 60 caractères au plus, jamais une adresse web', () {
      Map<String, String> names(String first, String last) {
        final errors = validateBookingDraft(BookingDraft(customerFirstName: first, customerLastName: last));
        return {for (final k in ['customerFirstName', 'customerLastName']) if (errors[k] != null) k: errors[k]!};
      }
      expect(names('Camille', 'Martin'), isEmpty);
      expect(names('  ', 'Martin'), {'customerFirstName': 'required'});
      expect(names('Camille', ''), {'customerLastName': 'required'});
      expect(names('C' * 61, 'Martin'), {'customerFirstName': 'too_long'});
      expect(names('C' * 60, 'M' * 60), isEmpty);
      expect(names('Camille', 'martin.com'), {'customerLastName': 'invalid_name'});
      expect(names('J.', 'Dupont'), isEmpty);
    });

    test('sièges auto (24/10/2026) : les enfants comptent dans les passagers ; envoyés seulement quand il y en a', () async {
      expect(validateBookingDraft(valid.copyWith(childSeats: const ChildSeats(infant: 1))), isEmpty);
      expect(validateBookingDraft(valid.copyWith(childSeats: const ChildSeats(infant: 1, booster: 1))), {'childSeats': 'child_seats_exceed_passengers'});
      expect(validateBookingDraft(valid.copyWith(childSeats: const ChildSeats(toddler: 5), passengers: 9)), {'childSeats': 'child_seats_range'});
      api.answer('create', CreatedBookingModel(reference: 'R7KQ2M', manageToken: 't', booking: booking(status: 'pending_payment', paymentMode: 'online')));
      final bloc = makeBloc()..add(const BookingFormStarted());
      await bloc.stream.firstWhere((s) => s.parkingResponse != null);
      bloc.add(BookingFormSubmitted(valid.copyWith(childSeats: const ChildSeats(booster: 1))));
      await bloc.stream.firstWhere((s) => s.created != null);
      expect(api.lastInput!.toJson(), containsPair('childSeats', {'infant': 0, 'toddler': 0, 'booster': 1}));
      expect(const BookingInput(airport: 'a', parking: 'p', arrivalAt: 'x', returnAt: 'y', customerFirstName: 'C', customerLastName: 'M', customerPhone: '06', customerEmail: 'c@m.fr', plate: 'AB-123-CD', passengers: 2, acceptTerms: true, childSeats: ChildSeats.none).toJson().containsKey('childSeats'), isFalse);
      await bloc.close();
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
      // 09/10/2026: first and last name apart; the API builds "Camille Martin" itself.
      expect(body, containsPair('customerFirstName', 'Camille'));
      expect(body, containsPair('customerLastName', 'Martin'));
      expect(body.keys, isNot(contains('customerName')));
      expect(body, containsPair('returnFlight', 'TO 3627'));
      expect(body, containsPair('idempotencyKey', 'a' * 32));
      expect(body.keys, isNot(contains('priceCents')));
      expect(s.created!.booking.status, 'pending_payment');
      // Kept for "Modifier" until it is paid; the manage token is on the phone.
      expect((drafts.draft?.customerFirstName, drafts.draft?.customerLastName), ('Camille', 'Martin'));
      expect(await storage.bookingToken('R7KQ2M'), 't');
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

    Future<BookingFormBloc> pump(WidgetTester tester, {String arrivalAt = '2026-10-03T08:00'}) async {
      final bloc = makeBloc(arrivalAt: arrivalAt)..add(const BookingFormStarted());
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
      for (final label in ['Prénom', 'Nom', 'Téléphone mobile (pour le SMS de la navette)', 'Email (confirmation)', 'Plaque d\'immatriculation', 'Vol retour (conseillé)', 'Passagers']) {
        expect(find.text(label), findsWidgets, reason: label);
      }
      expect(find.text('Plaque française ou étrangère.'), findsOneWidget);
      await tester.tap(find.text('Continuer vers le paiement'));
      await tester.pumpAndSettle();
      expect(find.text('Certains champs sont à corriger.'), findsOneWidget);
      // First name, last name, phone, email, plate.
      expect(find.text('Champ obligatoire.'), findsNWidgets(5));
      expect(find.text('Merci d\'accepter les conditions pour réserver.'), findsOneWidget);
      expect(api.calls, isNot(contains('create')));
    });

    testWidgets('sièges auto (24/10/2026) : « Des enfants à bord ? », les compteurs, la ligne du récapitulatif et l’erreur', (tester) async {
      drafts.save(valid);
      await pump(tester);
      final card = find.byKey(const Key('booking-child-seats'));
      await tester.scrollUntilVisible(card, 300, scrollable: find.byType(Scrollable).first);
      expect(find.text('Des enfants à bord ?'), findsOneWidget);
      expect(find.text('Le parking prépare les sièges dans la navette'), findsOneWidget);
      expect(find.byKey(const Key('child-seat-more-infant')), findsNothing, reason: 'the steppers wait for the switch');
      await tester.tap(find.byKey(const Key('child-seats-switch')));
      await tester.pumpAndSettle();
      await tester.scrollUntilVisible(find.byKey(const Key('child-seat-more-booster')), 200, scrollable: find.byType(Scrollable).first);
      expect(find.text("Les enfants comptent dans les passagers. Sièges prêtés à l'aller comme au retour, gratuit."), findsOneWidget);
      await tester.tap(find.byKey(const Key('child-seat-more-infant')));
      await tester.pumpAndSettle();
      // The recap, at the top, says the passengers and the seats.
      expect(find.text('2 passagers · 1 siège bébé'), findsOneWidget);
      // Two seats for two passengers: no adult left.
      await tester.tap(find.byKey(const Key('child-seat-more-booster')));
      await tester.pumpAndSettle();
      expect(find.text('2 passagers · 1 siège bébé · 1 réhausseur'), findsOneWidget);
      await tester.scrollUntilVisible(find.byKey(const Key('booking-submit')), 300, scrollable: find.byType(Scrollable).first);
      await tester.tap(find.byKey(const Key('booking-submit')));
      await tester.pumpAndSettle();
      expect(api.calls, isNot(contains('create')));
      expect(find.text('Les enfants comptent dans les passagers : ajoutez-les au nombre de passagers.'), findsOneWidget);
      // Switched off, nothing is asked any more: the recap line goes.
      await tester.scrollUntilVisible(find.byKey(const Key('child-seats-switch')), -300, scrollable: find.byType(Scrollable).first);
      await tester.tap(find.byKey(const Key('child-seats-switch')));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('booking-child-seats-recap')), findsNothing);
    });

    testWidgets('frais de nuit : « Forfait 8 jours », « Frais de nuit · dépôt à 23:30 », puis le total', (tester) async {
      public.parking_ = parkingResponse(
        night: nightRule22to6,
        offer: const OfferModel(available: true, days: 8, priceCents: 5160, basePriceCents: 3660, nightFee: dropOffNightFee),
      );
      await pump(tester, arrivalAt: '2026-10-03T23:30');
      expect(find.text('Forfait 8 jours'), findsOneWidget);
      expect(find.text('36,60 €'), findsOneWidget);
      expect(find.text('Frais de nuit · dépôt à 23:30'), findsOneWidget);
      expect(find.text('15,00 €'), findsOneWidget);
      expect(find.descendant(of: find.byKey(const Key('booking-total')), matching: find.text('Total')), findsOneWidget);
      expect(find.text('51,60 €'), findsOneWidget);
      // The rows come in this order, above the total.
      final package = tester.getTopLeft(find.byKey(const Key('price-package'))).dy;
      final fee = tester.getTopLeft(find.byKey(const Key('price-night-fee'))).dy;
      final total = tester.getTopLeft(find.byKey(const Key('booking-total'))).dy;
      expect(package < fee && fee < total, isTrue);
      // The parking's rule sits under the detail.
      expect(find.text('Ce parking ajoute 15 € pour un dépôt ou un retour entre 22:00 et 06:00.'), findsOneWidget);
      expect(tester.getTopLeft(find.byKey(const Key('booking-night-rule'))).dy > total, isTrue);
      // The button's sentence, at the bottom of the form, says the same total.
      final payNext = find.text('Paiement sécurisé par carte à l\'étape suivante : 51,60 €.');
      await tester.scrollUntilVisible(payNext, 300, scrollable: find.byType(Scrollable).first);
      expect(payNext, findsOneWidget);
    });

    testWidgets('séjour sans frais chez un parking qui en a : total seul, la règle du parking dessous', (tester) async {
      public.parking_ = parkingResponse(night: nightRule22to6);
      await pump(tester);
      expect(find.text('Total · 8 jours'), findsOneWidget);
      expect(find.byKey(const Key('price-night-fee')), findsNothing);
      expect(find.text('Ce parking ajoute 15 € pour un dépôt ou un retour entre 22:00 et 06:00.'), findsOneWidget);
    });

    testWidgets('sans frais de nuit : « Total · 8 jours » seul, comme avant', (tester) async {
      await pump(tester);
      expect(find.text('Total · 8 jours'), findsOneWidget);
      expect(find.byKey(const Key('price-package')), findsNothing);
      expect(find.byKey(const Key('price-night-fee')), findsNothing);
      expect(find.byKey(const Key('booking-night-rule')), findsNothing);
    });

    testWidgets('règle de nuit sans montant : pas de phrase', (tester) async {
      public.parking_ = parkingResponse(night: const NightRuleModel(start: '22:00', end: '06:00'));
      await pump(tester);
      expect(find.byKey(const Key('booking-night-rule')), findsNothing);
    });

    testWidgets('prénom et nom : deux champs remplis automatiquement par le téléphone', (tester) async {
      await pump(tester);
      final first = tester.widget<TextField>(find.byKey(const Key('field-first-name')));
      final last = tester.widget<TextField>(find.byKey(const Key('field-last-name')));
      expect(first.autofillHints, [AutofillHints.givenName]);
      expect(last.autofillHints, [AutofillHints.familyName]);
      expect(first.decoration?.labelText, 'Prénom');
      expect(last.decoration?.labelText, 'Nom');
    });

    testWidgets('« Modifier » : le brouillon rouvre le prénom et le nom', (tester) async {
      drafts.save(valid);
      await pump(tester);
      expect(tester.widget<TextField>(find.byKey(const Key('field-first-name'))).controller?.text, 'Camille');
      expect(tester.widget<TextField>(find.byKey(const Key('field-last-name'))).controller?.text, 'Martin');
    });

    testWidgets('erreur d’un champ renvoyée par le serveur, traduite', (tester) async {
      api.answer('create', const ApiError('validation_failed', fields: {'customerLastName': 'invalid_name'}));
      await pump(tester);
      await tester.enterText(find.byKey(const Key('field-first-name')), 'Camille');
      await tester.enterText(find.byKey(const Key('field-last-name')), 'Martin');
      await tester.enterText(find.byKey(const Key('field-phone')), '0612345678');
      await tester.enterText(find.byKey(const Key('field-email')), 'camille@exemple.fr');
      await tester.enterText(find.descendant(of: find.byKey(const Key('field-plate')), matching: find.byType(TextField)), 'gk318px');
      await tester.tap(find.byKey(const Key('field-terms')));
      await tester.pump();
      expect(find.text('Plaque française reconnue.'), findsOneWidget);
      await tester.tap(find.text('Continuer vers le paiement'));
      await tester.pumpAndSettle();
      expect(api.calls, contains('create'));
      expect(find.text('Lettres, espaces, apostrophes et tirets seulement.'), findsOneWidget);
      final lastName = tester.widget<TextField>(find.byKey(const Key('field-last-name')));
      expect(lastName.decoration?.errorText, 'Lettres, espaces, apostrophes et tirets seulement.');
      expect(tester.widget<TextField>(find.byKey(const Key('field-first-name'))).decoration?.errorText, isNull);
    });

  });
}
