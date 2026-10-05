import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/features/pro_auth/data/models/staff_model.dart';
import 'package:parking_app/src/features/pro_auth/presentation/bloc/pro_auth_bloc.dart';
import 'package:parking_app/src/features/pro_auth/presentation/pages/pro_vehicle_page.dart';
import 'package:parking_app/src/features/pro_shuttle/data/models/shuttle_models.dart';

import '../../helpers/pump_app.dart';

class MockAuthBloc extends MockBloc<ProAuthEvent, ProAuthState> implements ProAuthBloc {}

void main() {
  setUpAll(() async {
    await setUpLocalizedTests();
    registerFallbackValue(const ProAuthVehicleChosen(null));
  });

  const karim = StaffModel(id: 'd1', name: 'Karim Benali', email: 'k@example.com', role: 'driver', post: 'driver', effectivePost: 'driver');
  const vehicles = [
    ShuttleVehicleModel(id: 'v1', model: 'Mercedes Vito', colour: 'blanche', plate: 'GH-456-JK', seats: 8, driverId: 'd1'),
    ShuttleVehicleModel(id: 'v2', model: 'Renault Trafic', seats: 8, holderId: 'd2', holderName: 'Léa Durand'),
    ShuttleVehicleModel(id: 'v3', model: 'Garage', inService: false),
  ];

  testWidgets('V-A · « Mon véhicule aujourd’hui » : en service seulement, le pris en gris, le choix enregistré', (tester) async {
    final bloc = MockAuthBloc();
    whenListen(bloc, const Stream<ProAuthState>.empty(), initialState: const ProAuthState(status: ProAuthStatus.signedIn, staff: karim));
    ProVehiclePage.loader = () async => vehicles;
    await pumpLocalized(tester, BlocProvider<ProAuthBloc>.value(value: bloc, child: const ProVehiclePage()));
    await tester.pumpAndSettle();
    expect(find.text("Mon véhicule aujourd'hui"), findsOneWidget);
    expect(find.text('Mercedes Vito · blanche'), findsOneWidget);
    expect(find.textContaining('Votre véhicule habituel'), findsOneWidget);
    expect(find.textContaining('Prise par Léa Durand'), findsOneWidget);
    expect(find.text('Garage'), findsNothing);
    // A taken vehicle cannot be picked; the free one can.
    await tester.tap(find.byKey(const Key('vehicle-day-v2')));
    await tester.tap(find.byKey(const Key('vehicle-day-v1')));
    await tester.pump();
    await tester.tap(find.byKey(const Key('vehicle-day-confirm')));
    expect(verify(() => bloc.add(captureAny())).captured.single, isA<ProAuthVehicleChosen>().having((e) => e.vehicleId, 'vehicleId', 'v1'));
  });

  testWidgets('V-A · « Sans véhicule attitré » rend le véhicule', (tester) async {
    final bloc = MockAuthBloc();
    whenListen(
      bloc,
      const Stream<ProAuthState>.empty(),
      initialState: ProAuthState(status: ProAuthStatus.signedIn, staff: karim.copyWith(vehicle: const TodayVehicleModel(id: 'v1', model: 'Mercedes Vito', colour: 'blanche'))),
    );
    ProVehiclePage.loader = () async => vehicles;
    await pumpLocalized(tester, BlocProvider<ProAuthBloc>.value(value: bloc, child: const ProVehiclePage()));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('vehicle-day-none')));
    await tester.pump();
    await tester.tap(find.byKey(const Key('vehicle-day-confirm')));
    expect(verify(() => bloc.add(captureAny())).captured.single, isA<ProAuthVehicleChosen>().having((e) => e.vehicleId, 'vehicleId', isNull));
  });
}
