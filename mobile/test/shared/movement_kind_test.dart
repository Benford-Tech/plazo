import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/features/pro_reservations/data/models/reservation_models.dart';
import 'package:parking_app/src/features/pro_reservations/presentation/widgets/reservation_tile.dart';
import 'package:parking_app/src/shared/theme/theme.dart';
import 'package:parking_app/src/shared/widgets/movement_kind.dart';

import '../helpers/pump_app.dart';

ReservationModel booking(String id, String status) => ReservationModel(
  id: id,
  reference: 'R$id',
  channel: 'phone',
  status: status,
  arrivalAt: DateTime.utc(2026, 10, 5, 4, 30),
  returnAt: DateTime.utc(2026, 10, 12, 16),
  passengers: 2,
  customerName: 'Camille Laurent',
  customerFirstName: 'Camille',
  customerLastName: 'Laurent',
  customerPhone: '06 12 34 56 78',
  plate: 'GK-318-PX',
);

/// « Arrivées · Départs » everywhere in Plazo Pro (28/10/2026): a booking's next movement tints its row.
void main() {
  setUpAll(setUpLocalizedTests);

  test('le prochain mouvement suit le statut', () {
    expect(nextMovementOf('upcoming'), Movement.arrival);
    expect(nextMovementOf('arrived'), Movement.departure);
    expect(nextMovementOf('back_at_parking'), Movement.departure);
    expect(nextMovementOf('returned'), isNull);
    expect(nextMovementOf('cancelled'), isNull);
  });

  testWidgets('la liste des réservations : ARRIVÉE en vert, DÉPART en indigo, rien une fois rendue', (tester) async {
    await pumpLocalized(
      tester,
      Scaffold(
        body: Column(
          children: [
            ReservationTile(reservation: booking('a', 'upcoming'), onTap: () {}),
            ReservationTile(reservation: booking('b', 'arrived'), onTap: () {}),
            ReservationTile(reservation: booking('c', 'returned'), onTap: () {}),
          ],
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.descendant(of: find.byKey(const Key('movement-a')), matching: find.textContaining('ARRIVÉE')), findsOneWidget);
    expect(find.descendant(of: find.byKey(const Key('movement-b')), matching: find.textContaining('DÉPART')), findsOneWidget);
    expect(find.byKey(const Key('movement-c')), findsNothing);
    final grounds = tester
        .widgetList<Material>(find.descendant(of: find.byType(ReservationTile), matching: find.byType(Material)))
        .map((m) => m.color);
    expect(grounds, containsAll([AppStatus.okSoft, AppStatus.infoSoft, AppColors.surface]));
  });
}
