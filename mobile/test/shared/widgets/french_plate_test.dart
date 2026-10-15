import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/features/pro_reservations/data/models/reservation_models.dart';
import 'package:parking_app/src/shared/widgets/french_plate.dart';

import '../../helpers/pump_app.dart';

/// 15/10/2026 (« ne pas planter à l'import quand la plaque est manquante »): a booking imported without its plate reads
/// « À saisir » in the plate; the API keeps sending a string ('').
void main() {
  setUpAll(setUpLocalizedTests);

  testWidgets('une plaque vide se lit « À saisir »', (tester) async {
    final semantics = tester.ensureSemantics();
    await pumpLocalized(tester, const Scaffold(body: Center(child: FrenchPlate(''))));
    expect(find.text('À saisir'), findsOneWidget);
    expect(find.bySemanticsLabel('Plaque à saisir'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('une plaque se lit telle quelle', (tester) async {
    final semantics = tester.ensureSemantics();
    await pumpLocalized(tester, const Scaffold(body: Center(child: FrenchPlate('AB-123-CD'))));
    expect(find.text('AB-123-CD'), findsOneWidget);
    expect(find.text('À saisir'), findsNothing);
    expect(find.bySemanticsLabel('Plaque AB-123-CD'), findsOneWidget);
    semantics.dispose();
  });

  test('une réservation importée sans plaque se lit, et son formulaire renvoie la plaque vide', () {
    final booking = ReservationModel.fromJson({
      'id': 'r1',
      'reference': 'R7KQ2M',
      'channel': 'aggregator',
      'channelDetail': 'Onepark',
      'status': 'upcoming',
      'arrivalAt': '2026-10-20T04:30:00.000Z',
      'returnAt': '2026-10-27T12:00:00.000Z',
      'passengers': 2,
      'customerName': 'Jean Martin',
      'customerPhone': '+33 6 12 34 56 78',
      'plate': '',
    });
    expect(booking.plate, '');
    const input = ReservationInput(arrivalAt: '2026-10-20T06:30', returnAt: '2026-10-27T14:00', customerFirstName: 'Jean', customerLastName: 'Martin', plate: '');
    expect(input.toBody(patch: true), containsPair('plate', ''));
    expect(input.toBody(), containsPair('plate', ''));
  });
}
