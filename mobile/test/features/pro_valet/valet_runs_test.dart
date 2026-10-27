import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/pro_valet/data/valet_runs_data_source.dart';
import 'package:parking_app/src/features/pro_valet/presentation/pages/pro_valet_page.dart';

import '../../helpers/pump_app.dart';

class FakeValetRuns implements ValetRunsDataSource {
  FakeValetRuns(this.model);
  ValetRunsModel model;
  final List<String> acts = [];

  @override
  Future<ValetRunsModel> fetch() async => model;

  @override
  Future<void> act(ValetRun run, String action) async {
    acts.add('${run.id}:$action');
    // The server's answer: the run is this valet's.
    model = ValetRunsModel.fromJson({
      'meetingPoint': 'Terminal 1 · dépose-minute',
      'runs': [
        {..._arrival, 'state': 'taken', 'mine': true, 'takenBy': {'id': 's1', 'firstName': 'Karim'}},
        _departure,
      ],
    });
  }
}

const _arrival = {
  'id': 'r1:arrival',
  'reservationId': 'r1',
  'kind': 'arrival',
  'state': 'todo',
  'meetAt': '2026-10-27T07:15:00.000Z',
  'leaveAt': '2026-10-27T06:50:00.000Z',
  'mine': false,
  'takenBy': null,
  'customerName': 'Claire Martin',
  'customerPhone': '0612345678',
  'plate': 'GH-456-JK',
  'passengers': 2,
  'departureFlight': 'EZY 4413',
  'flight': {'number': null},
};

const _departure = {
  'id': 'r2:departure',
  'reservationId': 'r2',
  'kind': 'departure',
  'state': 'taken',
  'meetAt': '2026-10-27T19:40:00.000Z',
  'leaveAt': '2026-10-27T19:10:00.000Z',
  'mine': false,
  'takenBy': {'id': 's2', 'firstName': 'Nadia'},
  'customerName': 'Sophie Roux',
  'customerPhone': '0698765432',
  'plate': 'KL-778-MN',
  'passengers': 1,
  'file': 'F07',
  'keyHook': '12',
  'flight': {'number': 'TO 3627', 'landedAt': '2026-10-27T19:02:00.000Z'},
};

/// « Voiturier au terminal » (27/10/2026, direction B): the valet's « Terminal » tab.
void main() {
  setUpAll(setUpLocalizedTests);
  late FakeValetRuns source;
  setUp(() {
    source = FakeValetRuns(ValetRunsModel.fromJson({'meetingPoint': 'Terminal 1 · dépose-minute', 'runs': [_arrival, _departure]}));
    locator.registerSingleton<ValetRunsDataSource>(source);
  });
  tearDown(() => locator.unregister<ValetRunsDataSource>());

  testWidgets('À faire, puis « Je prends » : la course passe En cours, avec « Voiture récupérée au terminal »', (tester) async {
    await pumpLocalized(tester, const ProValetPage());
    await tester.pumpAndSettle();
    expect(find.text('Rendez-vous : Terminal 1 · dépose-minute'), findsOneWidget);
    expect(find.text('À faire · 1'), findsOneWidget);
    expect(find.text('En cours · 1'), findsOneWidget);
    expect(find.text('Récupérer au Terminal 1 · dépose-minute'), findsOneWidget);
    expect(find.textContaining('vol aller EZY 4413'), findsOneWidget);

    await tester.tap(find.byKey(const Key('valet-take-r1:arrival')));
    await tester.pumpAndSettle();
    expect(source.acts, ['r1:arrival:take']);
    expect(find.text('Aucune course à prendre.'), findsOneWidget);

    await tester.tap(find.text('En cours · 2'));
    await tester.pumpAndSettle();
    expect(find.text('Pour vous'), findsOneWidget);
    expect(find.byKey(const Key('valet-done-r1:arrival')), findsOneWidget);
    expect(find.text('Voiture récupérée au terminal'), findsOneWidget);
    // Someone else's run: who went, and no gesture but the call.
    expect(find.text('Nadia y va'), findsOneWidget);
    expect(find.byKey(const Key('valet-done-r2:departure')), findsNothing);
    expect(find.textContaining('Atterri'), findsOneWidget);
    expect(find.textContaining('File F07'), findsOneWidget);
  });
}
