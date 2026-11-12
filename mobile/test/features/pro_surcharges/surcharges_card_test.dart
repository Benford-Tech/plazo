import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/pro_surcharges/data/surcharges_data_source.dart';
import 'package:parking_app/src/features/pro_surcharges/presentation/surcharges_card.dart';

import '../../helpers/pump_app.dart';

/// The server's answer, kept in memory: the parking offers « Dépannage · 5 € », the late rule suggests 10 €.
class FakeSurcharges implements SurchargesDataSource {
  final calls = <String>[];
  final applied = <AppliedSurcharge>[];
  bool suggest = true;
  List<SurchargeOption> options = const [SurchargeOption(key: 'breakdown', label: 'Dépannage', amountCents: 500)];

  BookingSurcharges get _now => BookingSurcharges(
    surcharges: List.of(applied),
    options: options,
    suggestion: suggest ? const LateSuggestion(lateMinutes: 48, amountCents: 1000, scheduledAt: '2026-11-12T21:10', arrivedAt: '2026-11-12T21:58') : null,
    totalCents: applied.fold(0, (t, s) => t + s.amountCents),
    canEdit: true,
  );

  @override
  Future<BookingSurcharges> list(String reservationId) async => _now;

  @override
  Future<BookingSurcharges> add(String reservationId, {String? key, String? label, int? amountCents}) async {
    calls.add('add:${key ?? '$label=$amountCents'}');
    if (key == 'late') suggest = false;
    final (name, cents) = switch (key) {
      'late' => ('Retard au rendez-vous', 1000),
      'breakdown' => ('Dépannage', 500),
      _ => (label!, amountCents!),
    };
    applied.add(AppliedSurcharge(id: 's${applied.length + 1}', label: name, amountCents: cents, at: '2026-11-12T22:04', by: 'Karim'));
    return _now;
  }

  @override
  Future<BookingSurcharges> remove(String reservationId, String surchargeId) async {
    calls.add('remove:$surchargeId');
    applied.removeWhere((s) => s.id == surchargeId);
    return _now;
  }

  @override
  Future<BookingSurcharges> dismiss(String reservationId) async {
    calls.add('dismiss');
    suggest = false;
    return _now;
  }
}

void main() {
  setUpAll(setUpLocalizedTests);
  late FakeSurcharges source;
  setUp(() {
    source = FakeSurcharges();
    locator.registerSingleton<SurchargesDataSource>(source);
  });
  tearDown(() => locator.unregister<SurchargesDataSource>());

  Future<void> show(WidgetTester tester) async {
    await pumpLocalized(tester, const Scaffold(body: SingleChildScrollView(child: SurchargesCard(reservationId: 'r1'))));
    await tester.pumpAndSettle();
  }

  testWidgets('le retard proposé s\'applique, un supplément s\'ajoute d\'un toucher et se retire', (tester) async {
    await show(tester);
    expect(find.text('Retard de 48 min au rendez-vous'), findsOneWidget);
    expect(find.textContaining('Prévu à 21:10, voiture déposée à 21:58'), findsOneWidget);

    await tester.tap(find.byKey(const Key('surcharge-apply-late')));
    await tester.pumpAndSettle();
    expect(source.calls, ['add:late']);
    expect(find.byKey(const Key('surcharge-suggestion')), findsNothing);
    expect(find.text('ajouté par Karim à 22:04'), findsOneWidget);

    await tester.tap(find.byKey(const Key('surcharge-add-breakdown')));
    await tester.pumpAndSettle();
    expect(tester.widget<Text>(find.byKey(const Key('surcharges-total'))).data, contains('15,00'));

    await tester.tap(find.byKey(const Key('surcharge-remove-s1')));
    await tester.pumpAndSettle();
    expect(source.calls.last, 'remove:s1');
    expect(tester.widget<Text>(find.byKey(const Key('surcharges-total'))).data, contains('5,00'));
  });

  testWidgets('« Non » écarte le retard ; « Autre montant… » demande un nom et un montant', (tester) async {
    await show(tester);
    await tester.tap(find.byKey(const Key('surcharge-dismiss')));
    await tester.pumpAndSettle();
    expect(source.calls, ['dismiss']);
    expect(find.byKey(const Key('surcharge-suggestion')), findsNothing);

    await tester.tap(find.byKey(const Key('surcharge-other')));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('surcharge-other-label')), 'Lavage express');
    await tester.enterText(find.byKey(const Key('surcharge-other-amount')), 'abc');
    await tester.tap(find.byKey(const Key('surcharge-other-confirm')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('surcharge-other-error')), findsOneWidget);
    await tester.enterText(find.byKey(const Key('surcharge-other-amount')), '12,50');
    await tester.tap(find.byKey(const Key('surcharge-other-confirm')));
    await tester.pumpAndSettle();
    expect(source.calls.last, 'add:Lavage express=1250');
    expect(find.text('Lavage express'), findsOneWidget);
  });

  testWidgets('caché quand le parking ne propose aucun supplément', (tester) async {
    source
      ..suggest = false
      ..options = const [];
    await show(tester);
    expect(find.byKey(const Key('surcharges-card')), findsNothing);
  });
}
