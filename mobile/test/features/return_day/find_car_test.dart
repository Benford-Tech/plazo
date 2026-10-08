import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/features/return_day/data/models/return_model.dart';
import 'package:parking_app/src/features/return_day/presentation/bloc/return_bloc.dart';
import 'package:parking_app/src/features/return_day/presentation/pages/find_car_page.dart';
import 'package:parking_app/src/shared/widgets/ign_map.dart';

import '../../helpers/fixtures.dart';
import '../../helpers/pump_app.dart';

class MockReturnBloc extends MockBloc<ReturnEvent, ReturnState> implements ReturnBloc {}

void main() {
  setUpAll(setUpLocalizedTests);

  Future<void> show(WidgetTester tester, TravellerReturnModel data) async {
    final bloc = MockReturnBloc();
    whenListen(bloc, const Stream<ReturnState>.empty(), initialState: ReturnState(now: t0, reference: 'R7KQ2M', data: data, fetchedAt: DateTime.now()));
    await pumpLocalized(tester, BlocProvider<ReturnBloc>.value(value: bloc, child: const FindCarPage(reference: 'R7KQ2M')));
  }

  testWidgets('la place du voiturier, la zone, le parking sur le plan et l’itinéraire', (tester) async {
    await show(
      tester,
      travellerReturn().copyWith(
        spot: const ReturnSpotModel(code: 'A-07', stayClass: 'short'),
        parking: const ReturnParkingModel(name: 'Parking Démo LYS', address: '12 route de l’Aéroport', location: ShuttlePositionModel(lat: 45.7375, lng: 5.0745)),
      ),
    );
    expect(find.text('Retrouver ma voiture'), findsOneWidget);
    expect(find.text('Place A-07'), findsOneWidget);
    expect(find.text('zone séjours courts'), findsOneWidget);
    expect(find.text('AB-123-CD'), findsOneWidget);
    expect(find.byType(IgnMap), findsOneWidget);
    expect(find.byKey(const Key('find-car-route')), findsOneWidget);
    expect(find.text('EN DIRECT'), findsOneWidget);
  });

  testWidgets('pas encore de place : le voiturier l’indiquera', (tester) async {
    await show(tester, travellerReturn());
    expect(find.text("Place en cours d'attribution"), findsOneWidget);
    expect(find.byType(IgnMap), findsNothing);
  });

  testWidgets('S-C · en file : la file du voiturier et la position depuis l’allée', (tester) async {
    await show(
      tester,
      travellerReturn().copyWith(
        file: const ReturnFileModel(code: 'F07', position: 3),
        parking: const ReturnParkingModel(name: 'Parking Démo LYS', address: '12 route de l’Aéroport', location: ShuttlePositionModel(lat: 45.7375, lng: 5.0745)),
      ),
    );
    expect(find.text('File F07'), findsOneWidget);
    expect(find.text("3e depuis l'allée"), findsOneWidget);
    expect(find.text('Place F07'), findsNothing);
    expect(find.byType(IgnMap), findsOneWidget);
  });

  testWidgets('S-C · première de la file ; sans position, le nom du parking', (tester) async {
    await show(tester, travellerReturn().copyWith(file: const ReturnFileModel(code: 'F02', position: 1)));
    expect(find.text('File F02'), findsOneWidget);
    expect(find.text("1re depuis l'allée"), findsOneWidget);
    await show(tester, travellerReturn().copyWith(file: const ReturnFileModel(code: 'F02')));
    expect(find.text('File F02'), findsOneWidget);
    expect(find.text('Parking Démo LYS'), findsWidgets);
  });

  test('S-C · le champ « file » de l’API se lit, ou reste nul', () {
    Map<String, dynamic> json(Object? file) => {
      'reference': 'R7KQ2M',
      'status': 'arrived',
      'returnAt': '2026-10-03T10:30',
      'parking': {'name': 'Parking Démo LYS'},
      'plate': 'AB-123-CD',
      'spot': null,
      'file': file,
    };
    expect(TravellerReturnModel.fromJson(json(null)).file, isNull);
    final m = TravellerReturnModel.fromJson(json({'code': 'F07', 'position': 3}));
    expect(m.file?.code, 'F07');
    expect(m.file?.position, 3);
    expect(TravellerReturnModel.fromJson(json({'code': 'F07', 'position': null})).file?.position, isNull);
  });
}
