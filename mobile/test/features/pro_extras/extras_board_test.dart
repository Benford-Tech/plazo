import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/features/pro_auth/data/models/staff_model.dart';
import 'package:parking_app/src/features/pro_auth/presentation/bloc/pro_auth_bloc.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/pro_extras/data/extras_board_data_source.dart';
import 'package:parking_app/src/features/pro_extras/presentation/pages/pro_extras_page.dart';

import '../../helpers/pump_app.dart';

Map<String, dynamic> _row(String id, {required DateTime dueAt, bool late = false, String? acceptedBy, Map<String, dynamic>? file, String? spot}) => {
  'id': id,
  'kind': 'ev_charge',
  'label': 'Recharge électrique',
  'priceCents': 3000,
  'status': 'ordered',
  'dueAt': dueAt.toUtc().toIso8601String(),
  'late': late,
  'acceptedAt': acceptedBy == null ? null : dueAt.subtract(const Duration(hours: 3)).toUtc().toIso8601String(),
  'acceptedBy': acceptedBy,
  'reservation': {
    'id': 'res-$id',
    'reference': 'R7KQ2M',
    'customerName': 'Claire Martin',
    'plate': 'GH-456-JK',
    'vehicleModel': 'Zoé',
    'vehicleColour': 'blanche',
    'status': 'arrived',
    'returnAt': dueAt.add(const Duration(hours: 1)).toUtc().toIso8601String(),
    'expectedReturnAt': dueAt.add(const Duration(hours: 1)).toUtc().toIso8601String(),
    'returnFlight': null,
    'spot': spot,
    'file': file,
  },
};

class FakeBoard implements ExtrasBoardDataSource {
  FakeBoard(this.rows);
  List<Map<String, dynamic>> rows;
  final List<String> acts = [];
  final List<String> views = [];

  @override
  Future<ExtrasBoard> fetch(String view) async {
    views.add(view);
    return ExtrasBoard.fromJson({
      'view': view,
      'timezone': 'Europe/Paris',
      'now': DateTime.now().toUtc().toIso8601String(),
      'counts': {'todo': rows.length, 'done': 0, 'refused': 0},
      'data': view == 'todo' ? rows : const [],
    });
  }

  @override
  Future<void> act(ExtrasBoardRow row, String action, {String? reason}) async {
    acts.add('${row.id}:$action${reason == null ? '' : ':$reason'}');
    if (action != 'accept') rows = rows.where((r) => r['id'] != row.id).toList();
  }
}

class MockAuthBloc extends MockBloc<ProAuthEvent, ProAuthState> implements ProAuthBloc {}

Widget _page() {
  final auth = MockAuthBloc();
  whenListen(
    auth,
    const Stream<ProAuthState>.empty(),
    initialState: const ProAuthState(
      status: ProAuthStatus.signedIn,
      staff: StaffModel(id: 'v1', name: 'Karim Benali', email: 'k@example.com', role: 'valet', post: 'valet', allowedPosts: ['valet']),
    ),
  );
  return BlocProvider<ProAuthBloc>.value(value: auth, child: const ProExtrasPage());
}

/// « Services à faire » (29/10/2026, direction C): the valet's « Services » tab.
void main() {
  setUpAll(setUpLocalizedTests);
  late FakeBoard source;
  final now = DateTime.now();
  setUp(() {
    source = FakeBoard([
      _row('x1', dueAt: now.subtract(const Duration(minutes: 30)), late: true, file: {'code': 'F04', 'rank': 2}),
      _row('x2', dueAt: now.add(const Duration(days: 1)), acceptedBy: 'Karim', spot: 'A12'),
    ]);
    locator.registerSingleton<ExtrasBoardDataSource>(source);
  });
  tearDown(() => locator.unregister<ExtrasBoardDataSource>());

  testWidgets('en retard en tête, la file, puis demain avec « Accepté par »', (tester) async {
    await pumpLocalized(tester, _page(), size: const Size(400, 1400));
    await tester.pumpAndSettle();
    expect(find.text('À faire · 2'), findsOneWidget);
    expect(find.text('EN RETARD · 1'), findsOneWidget);
    expect(find.text('DEMAIN · 1'), findsOneWidget);
    expect(find.textContaining('File F04 · 2e'), findsOneWidget);
    expect(find.textContaining('Place A12'), findsOneWidget);
    expect(find.text('Accepté par Karim'), findsOneWidget);
    expect(find.byKey(const Key('extras-accept-x1')), findsOneWidget);
    expect(find.byKey(const Key('extras-accept-x2')), findsNothing);
  });

  testWidgets('« Accepter », « Fait » et « Pas possible »', (tester) async {
    await pumpLocalized(tester, _page(), size: const Size(400, 1400));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('extras-accept-x1')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('extras-done-x1')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('extras-refuse-x2')));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('extras-refuse-reason')), 'Borne en panne');
    await tester.tap(find.byKey(const Key('extras-refuse-confirm')));
    await tester.pumpAndSettle();
    expect(source.acts, ['x1:accept', 'x1:done', 'x2:refuse:Borne en panne']);
    expect(find.byKey(const Key('extras-empty')), findsOneWidget);
  });
}
