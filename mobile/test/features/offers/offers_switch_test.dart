import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/more/presentation/pages/more_tab_page.dart';
import 'package:parking_app/src/features/offers/offers_data_source.dart';
import 'package:parking_app/src/services/link_service.dart';
import 'package:parking_app/src/services/push_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../helpers/fakes.dart';
import '../../helpers/pump_app.dart';

class _FakeOffers implements OffersDataSource {
  final calls = <({String id, bool? offers, String? platform})>[];

  @override
  Future<AppDeviceOffers> put(String subscriptionId, {bool? offers, String? platform}) async {
    calls.add((id: subscriptionId, offers: offers, platform: platform));
    return AppDeviceOffers(offers: offers ?? false);
  }
}

void main() {
  setUpAll(setUpLocalizedTests);
  late FakePushService push;
  late _FakeOffers offers;

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    push = FakePushService();
    offers = _FakeOffers();
    locator
      ..registerSingleton<LinkService>(FakeLinks())
      ..registerSingleton<PushService>(push)
      ..registerSingleton<OffersDataSource>(offers);
    PackageInfo.setMockInitialValues(appName: 'Plazo', packageName: 'p', version: '1.0.0', buildNumber: '1', buildSignature: '');
  });
  tearDown(locator.reset);

  bool switchValue(WidgetTester tester) => tester.widget<SwitchListTile>(find.byKey(const Key('offers-switch'))).value;

  testWidgets('« Offres et bons plans » : éteint par défaut, allumé après la permission, puis éteint', (tester) async {
    await pumpLocalized(tester, const MoreTabPage());
    await tester.pumpAndSettle();
    expect(find.text('Ma réservation'), findsOneWidget);
    expect(find.text('navette, rappel, atterrissage'), findsOneWidget);
    expect(find.text('Offres et bons plans'), findsOneWidget);
    expect(switchValue(tester), isFalse);

    await tester.tap(find.byKey(const Key('offers-switch')));
    await tester.pumpAndSettle();
    expect(push.enableCalls, 1);
    expect(offers.calls.single.id, 'sub-1');
    expect(offers.calls.single.offers, isTrue);
    expect(switchValue(tester), isTrue);
    final prefs = await SharedPreferences.getInstance();
    expect(prefs.getBool(offersPrefsKey), isTrue);

    await tester.tap(find.byKey(const Key('offers-switch')));
    await tester.pumpAndSettle();
    expect(push.enableCalls, 1);
    expect(offers.calls.last.offers, isFalse);
    expect(offers.calls.last.platform, isNull);
    expect(switchValue(tester), isFalse);
    expect(prefs.getBool(offersPrefsKey), isFalse);
  });

  testWidgets('permission refusée : reste éteint, avec le message des réglages', (tester) async {
    push.enableResult = null;
    await pumpLocalized(tester, const MoreTabPage());
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('offers-switch')));
    await tester.pumpAndSettle();
    expect(push.enableCalls, 1);
    expect(offers.calls, isEmpty);
    expect(switchValue(tester), isFalse);
    expect(find.text('Activez les notifications de Plazo dans les réglages du téléphone.'), findsOneWidget);
  });

  testWidgets('sans notifications (web) : reste éteint, avec le message de l\'application', (tester) async {
    push.supported = false;
    await pumpLocalized(tester, const MoreTabPage());
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('offers-switch')));
    await tester.pumpAndSettle();
    expect(push.enableCalls, 0);
    expect(switchValue(tester), isFalse);
    expect(find.text('Les notifications ne sont disponibles que dans l\'application installée.'), findsOneWidget);
  });

  testWidgets('le choix gardé sur le téléphone s\'affiche tout de suite', (tester) async {
    SharedPreferences.setMockInitialValues({offersPrefsKey: true});
    await pumpLocalized(tester, const MoreTabPage());
    await tester.pumpAndSettle();
    expect(switchValue(tester), isTrue);
  });
}
