import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/pro_keys/data/keys_data_source.dart';
import 'package:parking_app/src/features/pro_keys/presentation/keys_control.dart';

import '../../helpers/pump_app.dart';

class FakeKeys implements KeysDataSource {
  final calls = <(String, bool, String?)>[];
  String? refuse;

  @override
  Future<KeysState> setKeys(String reservationId, {required bool left, String? keyHook}) async {
    calls.add((reservationId, left, keyHook));
    if (refuse != null) {
      final options = RequestOptions(path: 'internal/reservations/$reservationId/keys');
      throw DioException(requestOptions: options, response: Response(requestOptions: options, statusCode: 400, data: {'code': refuse}));
    }
    final on = left || keyHook != null;
    return KeysState(keysLeftAt: on ? DateTime.utc(2026, 11, 1, 8, 47) : null, keyHook: keyHook);
  }
}

/// Direction A (01/11/2026): « Clés ? · Laissées · Crochet n° » on the dashboard tiles and the booking sheet.
void main() {
  setUpAll(setUpLocalizedTests);
  late FakeKeys keys;
  setUp(() {
    keys = FakeKeys();
    locator.registerSingleton<KeysDataSource>(keys);
  });
  tearDown(() => locator.unregister<KeysDataSource>());

  Future<List<KeysState>> show(WidgetTester tester, {String? keyHook, DateTime? keysLeftAt}) async {
    final changes = <KeysState>[];
    await pumpLocalized(
      tester,
      Scaffold(
        body: Padding(
          padding: const EdgeInsets.all(16),
          child: KeysControl(reservationId: 'r1', keyHook: keyHook, keysLeftAt: keysLeftAt, onChanged: changes.add),
        ),
      ),
    );
    await tester.pumpAndSettle();
    return changes;
  }

  testWidgets('« Laissées » en un toucher, puis un second toucher revient à « Clés ? »', (tester) async {
    final changes = await show(tester);
    await tester.tap(find.byKey(const Key('keys-left')));
    await tester.pumpAndSettle();
    expect(keys.calls.last, ('r1', true, null));
    expect(changes, hasLength(1));
    expect(find.textContaining('Clés laissées à'), findsOneWidget);

    await tester.tap(find.byKey(const Key('keys-left')));
    await tester.pumpAndSettle();
    expect(keys.calls.last, ('r1', false, null));
    expect(find.textContaining('Clés laissées à'), findsNothing);
  });

  testWidgets('« Crochet n° » ouvre le champ et enregistre le numéro', (tester) async {
    await show(tester);
    await tester.tap(find.byKey(const Key('keys-hook')));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('keys-hook-field')), ' 12 ');
    await tester.tap(find.byKey(const Key('keys-hook-save')));
    await tester.pumpAndSettle();
    expect(keys.calls.last, ('r1', true, '12'));
    expect(find.text('Crochet 12'), findsOneWidget);
    expect(find.byKey(const Key('keys-hook-field')), findsNothing);
  });

  testWidgets('« Clés ? » retire le crochet', (tester) async {
    await show(tester, keyHook: '7', keysLeftAt: DateTime.utc(2026, 11, 1, 7));
    expect(find.text('Crochet 7'), findsOneWidget);
    await tester.tap(find.byKey(const Key('keys-none')));
    await tester.pumpAndSettle();
    expect(keys.calls.last, ('r1', false, null));
    expect(find.text('Crochet n°'), findsOneWidget);
  });

  testWidgets('un refus du serveur remet l’état d’avant et le dit', (tester) async {
    keys.refuse = 'vehicle_not_on_site';
    final changes = await show(tester);
    await tester.tap(find.byKey(const Key('keys-left')));
    await tester.pumpAndSettle();
    expect(changes, isEmpty);
    expect(find.textContaining('Clés laissées à'), findsNothing);
    expect(find.textContaining("La voiture n'est pas au parking"), findsOneWidget);
  });
}
