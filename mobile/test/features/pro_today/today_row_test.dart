import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/features/arrival/data/models/arrival_model.dart';
import 'package:parking_app/src/features/pro_today/presentation/bloc/pro_today_bloc.dart';
import 'package:parking_app/src/features/pro_today/presentation/widgets/today_row.dart';
import 'package:parking_app/src/shared/widgets/ign_map.dart';

import '../../helpers/fixtures.dart';
import '../../helpers/pump_app.dart';

void main() {
  setUpAll(setUpLocalizedTests);

  Future<void> show(WidgetTester tester, Widget child) => pumpLocalized(tester, Scaffold(body: ListView(children: [child])));

  testWidgets('carte « en approche » : ETA, mini-carte, âge de la position', (tester) async {
    await show(tester, TodayRowTile(row: TodayRow(row('r1', 'Camille Martin', 'AB-123-CD', t0), staffSignal('r1')), isReturn: false, positionAge: 20));
    expect(find.text('● EN APPROCHE · 12 MIN'), findsOneWidget);
    expect(find.byType(IgnMap), findsOneWidget);
    expect(find.textContaining('Position mise à jour il y a 20 s · 8,4 km · arrivée estimée'), findsOneWidget);
    expect(find.text('Camille Martin · 2 pass.'), findsOneWidget);
  });

  testWidgets('prévenu sans partage, et retour au point de rendez-vous', (tester) async {
    await show(
      tester,
      Column(
        children: [
          TodayRowTile(
            row: TodayRow(row('r2', 'Léa Durand', 'GH-456-JK', t0), staffSignal('r2', state: ArrivalSignalState.announced, announcedMinutes: 20, withPosition: false)),
            isReturn: false,
            positionAge: null,
          ),
          TodayRowTile(
            row: TodayRow(row('r3', 'Quentin Roux', 'QR-321-ST', t0), staffSignal('r3', kind: ArrivalKind.returnTrip, state: ArrivalSignalState.atMeetingPoint, withPosition: false)),
            isReturn: true,
            positionAge: null,
          ),
          TodayRowTile(row: TodayRow(row('r4', 'Louis Leroy', 'LM-789-NP', t0), null), isReturn: false, positionAge: null),
        ],
      ),
    );
    expect(find.text('Prévenu · « dans 20 min »'), findsOneWidget);
    expect(find.text('● AU POINT DE RENDEZ-VOUS'), findsOneWidget);
    expect(find.text('À venir'), findsOneWidget);
    expect(find.byType(IgnMap), findsNothing);
  });

  testWidgets('bandeau : textes des événements', (tester) async {
    await show(tester, ArrivalBanner(signal: staffSignal('r1'), onSee: () {}, onClose: () {}));
    expect(find.text('C. Martin arrive dans 12 min — AB-123-CD'), findsOneWidget);
    expect(
      ArrivalBanner.text(staffSignal('r3', kind: ArrivalKind.returnTrip, state: ArrivalSignalState.atMeetingPoint, name: 'Quentin Roux', plate: 'QR-321-ST')),
      'Retour : Q. Roux est au point de rendez-vous — QR-321-ST',
    );
    expect(
      ArrivalBanner.text(staffSignal('r2', state: ArrivalSignalState.announced, announcedMinutes: 20, name: 'Léa Durand', plate: 'GH-456-JK')),
      "L. Durand : « J'arrive dans 20 min » — GH-456-JK",
    );
  });
}
