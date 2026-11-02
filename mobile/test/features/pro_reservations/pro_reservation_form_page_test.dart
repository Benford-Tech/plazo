import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/core/error/failure.dart';
import 'package:parking_app/src/core/utils/either.dart';
import 'package:parking_app/src/features/pro_reservations/data/models/reservation_models.dart';
import 'package:parking_app/src/features/pro_reservations/domain/usecases/reservations_use_cases.dart';
import 'package:parking_app/src/features/pro_reservations/presentation/bloc/pro_reservation_form_bloc.dart';
import 'package:parking_app/src/features/pro_reservations/presentation/pages/pro_reservation_form_page.dart';
import 'package:parking_app/src/shared/child_seats/child_seats.dart';

import '../../helpers/pump_app.dart';

class MockSave extends Mock implements SaveReservationUseCase {}

class MockCapacity extends Mock implements PreviewCapacityUseCase {}

/// A booking imported from a comparator's email, its amount read from the email.
const imported = ReservationInput(channel: 'aggregator', channelDetail: 'Allopark', arrivalAt: '2026-10-05T06:30', returnAt: '2026-10-06T18:00', customerFirstName: 'Jean', customerLastName: 'Dupont', plate: 'GK-318-PX', priceCents: 2600);

void main() {
  setUpAll(() async {
    await setUpLocalizedTests();
    registerFallbackValue(const SaveReservationParams(input: ReservationInput(arrivalAt: '', returnAt: '')));
    registerFallbackValue(const CapacityParams(arrivalAt: '', returnAt: ''));
  });

  // 10/10/2026 (« Pouvoir modifier le prix après l'intégration du mail »).
  Future<MockSave> pumpForm(WidgetTester tester, ReservationInput initial) async {
    final save = MockSave();
    final capacity = MockCapacity();
    when(() => capacity(any())).thenAnswer((_) async => const Right(CapacityPreviewModel(nights: 1)));
    await pumpLocalized(
      tester,
      BlocProvider(
        create: (_) => ProReservationFormBloc(save, capacity, id: 'r1', initial: initial),
        child: const ProReservationFormPage(id: 'r1'),
      ),
      size: const Size(400, 1600), // the whole form, save button included
    );
    return save;
  }

  TextField priceField(WidgetTester tester) => tester.widget<TextField>(find.byKey(const Key('f-price')));

  testWidgets('le prix payé est prérempli et modifiable ; un montant invalide reste sous le champ', (tester) async {
    final save = await pumpForm(tester, imported);
    expect(priceField(tester).controller?.text, '26,00');
    expect(priceField(tester).enabled, isNot(isFalse));
    expect(find.text('Prix payé'), findsOneWidget);
    expect(find.text('Ce que paie le client, sans les frais du comparateur.'), findsOneWidget);
    await tester.enterText(find.byKey(const Key('f-price')), '45,505');
    await tester.pump();
    await tester.tap(find.byKey(const Key('f-save')));
    await tester.pump();
    expect(find.text('Montant invalide (ex. 45,50).'), findsOneWidget);
    verifyNever(() => save(any()));
  });

  testWidgets('sièges auto (24/10/2026) : les compteurs sous les passagers, envoyés à la modification une fois changés', (tester) async {
    final save = await pumpForm(tester, imported.copyWith(passengers: 3));
    when(() => save(any())).thenAnswer((_) async => const Left(ServerFailure(statusCode: 400, code: 'validation_failed', fields: {'childSeats': 'child_seats_exceed_passengers'})));
    // Folded until opened (direction A, 02/11/2026).
    expect(find.byKey(const Key('f-child-seats')), findsNothing);
    await tester.tap(find.byKey(const Key('f-child-seats-add')));
    await tester.pump();
    expect(find.text('Sièges auto pour la navette'), findsOneWidget);
    expect(find.byKey(const Key('f-child-seats')), findsOneWidget);
    await tester.tap(find.byKey(const Key('child-seat-more-infant')));
    await tester.pump();
    await tester.tap(find.byKey(const Key('child-seat-more-booster')));
    await tester.pump();
    await tester.ensureVisible(find.byKey(const Key('f-save')));
    await tester.tap(find.byKey(const Key('f-save')));
    await tester.pumpAndSettle();
    final params = verify(() => save(captureAny())).captured.single as SaveReservationParams;
    expect(params.seats, isTrue);
    expect(params.input.childSeats, const ChildSeats(infant: 1, booster: 1));
    expect(params.input.toBody(patch: true, names: params.names, price: params.price, seats: params.seats), containsPair('childSeats', {'infant': 1, 'toddler': 0, 'booster': 1}));
    expect(params.input.toBody(patch: true, names: params.names, price: params.price).containsKey('childSeats'), isFalse, reason: 'untouched seats are not sent');
    expect(find.byKey(const Key('f-child-seats-error')), findsOneWidget);
    expect(find.text('Les enfants comptent dans les passagers.'), findsOneWidget);
  });

  testWidgets('réservation payée sur Plazo : le prix est en lecture seule', (tester) async {
    await pumpForm(tester, imported.copyWith(channel: 'plazo', channelDetail: null));
    expect(priceField(tester).enabled, isFalse);
    expect(find.text('Payé en ligne sur Plazo : le prix ne se modifie pas.'), findsOneWidget);
  });

  testWidgets('direction A (02/11/2026) : cartes par sujet, « En direct » au téléphone, passagers en − +, payé par', (tester) async {
    final save = await pumpForm(tester, imported.copyWith(channel: 'phone', channelDetail: null, passengers: 2));
    when(() => save(any())).thenAnswer((_) async => const Left(ServerFailure(statusCode: 400, code: 'validation_failed')));
    for (final title in ['SÉJOUR', 'CLIENT', 'VOITURE', 'VOYAGE ET NAVETTE', 'CANAL ET PRIX']) {
      expect(find.text(title), findsOneWidget);
    }
    expect(find.byKey(const Key('f-direct')), findsOneWidget);
    expect(find.text('En direct'), findsOneWidget);
    // A comparator is not direct.
    await tester.scrollUntilVisible(find.byKey(const Key('f-channel-aggregator')), 200, scrollable: find.byType(Scrollable).first);
    await tester.tap(find.byKey(const Key('f-channel-aggregator')));
    await tester.pump();
    expect(find.byKey(const Key('f-direct')), findsNothing);
    expect(find.byKey(const Key('f-detail')), findsOneWidget);
    await tester.scrollUntilVisible(find.byKey(const Key('f-channel-counter')), 200, scrollable: find.byType(Scrollable).first);
    await tester.tap(find.byKey(const Key('f-channel-counter')));
    await tester.pump();
    expect(find.byKey(const Key('f-direct')), findsOneWidget);

    await tester.scrollUntilVisible(find.byKey(const Key('f-passengers-more')), 200, scrollable: find.byType(Scrollable).first);
    await tester.tap(find.byKey(const Key('f-passengers-more')));
    await tester.pump();
    await tester.scrollUntilVisible(find.byKey(const Key('f-paid-cash')), 200, scrollable: find.byType(Scrollable).first);
    await tester.tap(find.byKey(const Key('f-paid-cash')));
    await tester.pump();
    // The notes stay folded behind « + Ajouter ».
    expect(find.byKey(const Key('f-notes')), findsNothing);
    await tester.scrollUntilVisible(find.byKey(const Key('f-notes-add')), 200, scrollable: find.byType(Scrollable).first);
    await tester.tap(find.byKey(const Key('f-notes-add')));
    await tester.pump();
    expect(find.byKey(const Key('f-notes')), findsOneWidget);

    await tester.tap(find.byKey(const Key('f-save')));
    await tester.pumpAndSettle();
    final params = verify(() => save(captureAny())).captured.single as SaveReservationParams;
    expect(params.input.channel, 'counter');
    expect(params.input.passengers, 3);
    expect(params.input.toBody(patch: true), containsPair('paymentMethod', 'cash'));
  });

  test('payé par : jamais envoyé pour une réservation Plazo, effacé à la modification quand on le retire', () {
    expect(imported.copyWith(channel: 'plazo', paymentMethod: 'card').toBody(patch: true).containsKey('paymentMethod'), isFalse);
    expect(imported.toBody(patch: true), containsPair('paymentMethod', null));
    expect(imported.toBody().containsKey('paymentMethod'), isFalse);
  });
}
