import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/booking/data/datasources/app_link_data_source.dart';
import 'package:parking_app/src/features/booking/presentation/pages/app_link_page.dart';

import '../../helpers/pump_app.dart';

class _FailingAppLinks implements AppLinkDataSource {
  @override
  Future<AppLinkTarget> resolve(String code) async => throw Exception('404');

  @override
  Future<AppLinkTarget?> resume({String? code}) async => null;
}

void main() {
  setUpAll(setUpLocalizedTests);

  group('« Lien court Plazo » (27/10/2026)', () {
    test('lit la réponse de l’API', () {
      final target = AppLinkTarget.fromJson({
        'found': true,
        'match': 'device',
        'reference': 'R7KQ2M',
        'manageToken': 'tok',
        'firstName': 'Léa',
        'parking': {'title': 'Parking des Cèdres'},
        'arrivalAt': '2026-10-29T06:30',
        'returnAt': '2026-11-02T18:00',
      });
      expect(target.reference, 'R7KQ2M');
      expect(target.manageToken, 'tok');
      expect(target.firstName, 'Léa');
      expect(target.parkingTitle, 'Parking des Cèdres');
      expect(target.match, 'device');
      expect(appLinkPlatform(), anyOf('ios', 'android'));
    });

    testWidgets('un code inconnu : « Lien inconnu ou expiré » et « Retrouver ma réservation »', (tester) async {
      if (locator.isRegistered<AppLinkDataSource>()) locator.unregister<AppLinkDataSource>();
      locator.registerSingleton<AppLinkDataSource>(_FailingAppLinks());
      addTearDown(() => locator.unregister<AppLinkDataSource>());
      await pumpLocalized(tester, const AppLinkPage(code: 'R7KQ2M-AAAAAAAA'));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('app-link-invalid')), findsOneWidget);
      expect(find.text('Retrouver ma réservation'), findsOneWidget);
    });
  });
}
