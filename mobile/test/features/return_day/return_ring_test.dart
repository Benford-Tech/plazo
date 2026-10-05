import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/features/return_day/data/models/return_model.dart';
import 'package:parking_app/src/features/return_day/presentation/bloc/return_bloc.dart';
import 'package:parking_app/src/features/return_day/presentation/widgets/return_ring.dart';
import 'package:parking_app/src/shared/widgets/live_pill.dart';

import '../../helpers/fixtures.dart';
import '../../helpers/pump_app.dart';

void main() {
  setUpAll(setUpLocalizedTests);

  Future<void> show(WidgetTester tester, TravellerReturnModel data, ReturnStep step) async {
    await pumpLocalized(tester, Scaffold(body: SingleChildScrollView(child: ReturnRing(data: data, step: step, fetchedAt: DateTime.now()))));
  }

  testWidgets('avant l’atterrissage : compte à rebours, heure prévue et retard, étape « Atterrissage »', (tester) async {
    final lands = DateTime.now().add(const Duration(hours: 1, minutes: 2, seconds: 5));
    await show(
      tester,
      travellerReturn(flight: FlightViewModel(number: 'TO 3627', status: 'delayed', scheduledAt: lands.subtract(const Duration(minutes: 40)), estimatedAt: lands)),
      ReturnStep.flight,
    );
    expect(find.text('Vol TO 3627'), findsOneWidget);
    expect(find.text('atterrit dans'), findsOneWidget);
    expect(find.textContaining(RegExp(r'^01:0[12]:')), findsOneWidget);
    expect(find.textContaining('retard +40 min'), findsOneWidget);
    expect(find.byType(LivePill), findsOneWidget);
    expect(find.text('EN DIRECT'), findsOneWidget);
  });

  testWidgets('atterri : l’heure, puis la navette avec son compte à rebours', (tester) async {
    await show(tester, travellerReturn(flight: landedFlight()), ReturnStep.meetingPoint);
    expect(find.text('atterri à'), findsOneWidget);
    expect(find.text('rejoignez le point de rendez-vous'), findsOneWidget);
    await show(
      tester,
      travellerReturn(flight: landedFlight(), shuttle: travellerShuttle().copyWith(etaAt: DateTime.now().add(const Duration(minutes: 4, seconds: 10)), distanceM: 2100)),
      ReturnStep.shuttle,
    );
    expect(find.text('navette dans'), findsOneWidget);
    expect(find.textContaining(RegExp(r'^04:(09|10)$')), findsOneWidget);
    expect(find.text('à 2,1 km de vous'), findsOneWidget);
  });
}
