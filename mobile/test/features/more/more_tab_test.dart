import 'package:flutter_test/flutter_test.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/more/presentation/pages/more_tab_page.dart';
import 'package:parking_app/src/services/link_service.dart';

import '../../helpers/fakes.dart';
import '../../helpers/pump_app.dart';

void main() {
  setUpAll(setUpLocalizedTests);
  late FakeLinks links;
  setUp(() {
    links = FakeLinks();
    locator.registerSingleton<LinkService>(links);
    PackageInfo.setMockInitialValues(appName: 'Plazo', packageName: 'p', version: '1.0.0', buildNumber: '1', buildSignature: '');
  });
  tearDown(locator.reset);

  testWidgets('« Plus » : espace pro, pages du site, contact, version', (tester) async {
    await pumpLocalized(tester, const MoreTabPage());
    await tester.pumpAndSettle();
    expect(find.text('Espace pro'), findsOneWidget);
    expect(find.text('Plazo · Version 1.0.0 (1)'), findsOneWidget);
    final expected = {
      'Questions fréquentes': '/#faq',
      'Conditions générales': '/conditions',
      'Confidentialité': '/confidentialite',
      'Mentions légales': '/mentions-legales',
    };
    for (final MapEntry(key: label, value: path) in expected.entries) {
      await tester.tap(find.text(label));
      expect(links.opened.last.toString(), endsWith(path), reason: label);
      expect(links.opened.last.toString(), startsWith('https://'));
    }
    await tester.tap(find.text('Nous contacter'));
    expect(links.opened.last.scheme, 'mailto');
  });
}
