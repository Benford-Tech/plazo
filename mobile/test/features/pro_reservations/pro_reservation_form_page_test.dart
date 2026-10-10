import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/core/utils/either.dart';
import 'package:parking_app/src/features/pro_reservations/data/models/reservation_models.dart';
import 'package:parking_app/src/features/pro_reservations/domain/usecases/reservations_use_cases.dart';
import 'package:parking_app/src/features/pro_reservations/presentation/bloc/pro_reservation_form_bloc.dart';
import 'package:parking_app/src/features/pro_reservations/presentation/pages/pro_reservation_form_page.dart';

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

  testWidgets('réservation payée sur Plazo : le prix est en lecture seule', (tester) async {
    await pumpForm(tester, imported.copyWith(channel: 'plazo', channelDetail: null));
    expect(priceField(tester).enabled, isFalse);
    expect(find.text('Payé en ligne sur Plazo : le prix ne se modifie pas.'), findsOneWidget);
  });
}
