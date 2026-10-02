import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:parking_app/src/shared/theme/theme.dart';
import 'package:parking_app/src/shared/widgets/ign_map.dart';
import 'package:parking_app/src/shared/widgets/live_dot.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Loads the French texts once, without network (no map tiles) nor endless animations.
Future<void> setUpLocalizedTests() async {
  TestWidgetsFlutterBinding.ensureInitialized();
  SharedPreferences.setMockInitialValues({});
  EasyLocalization.logger.enableBuildModes = [];
  await EasyLocalization.ensureInitialized();
  await initializeDateFormatting('fr_FR');
  IgnMap.tilesEnabled = false;
  LiveDot.animationsEnabled = false;
}

Future<void> pumpLocalized(WidgetTester tester, Widget child, {Size size = const Size(400, 900)}) async {
  tester.view.physicalSize = size * tester.view.devicePixelRatio;
  addTearDown(tester.view.resetPhysicalSize);
  final app = EasyLocalization(
    supportedLocales: const [Locale('fr', 'FR')],
    startLocale: const Locale('fr', 'FR'),
    fallbackLocale: const Locale('fr', 'FR'),
    useOnlyLangCode: false,
    saveLocale: false,
    path: 'assets/l10n',
    child: Builder(
      builder: (context) => MaterialApp(
        theme: appTheme(),
        locale: context.locale,
        supportedLocales: context.supportedLocales,
        localizationsDelegates: context.localizationDelegates,
        home: child,
      ),
    ),
  );
  // Translations load asynchronously from the assets: the first build runs outside the fake
  // clock so that the loading completes.
  await tester.runAsync(() async {
    await tester.pumpWidget(app);
    await Future<void>.delayed(const Duration(milliseconds: 100));
  });
  for (var i = 0; i < 3; i++) {
    await tester.pump(const Duration(milliseconds: 20));
  }
}
