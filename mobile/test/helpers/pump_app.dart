import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:parking_app/src/features/booking/presentation/widgets/app_link_resume.dart';
import 'package:parking_app/src/shared/theme/theme.dart';
import 'package:parking_app/src/shared/tutorials/tutorial_service.dart';
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
  // The tutorials have their own tests: elsewhere, the screens open without them.
  TutorialService.enabled = false;
  // The short link's first-launch check talks to the API: never in the widget tests.
  AppLinkResumeGate.enabled = false;
}

/// The app's own fonts instead of the test font (whose glyphs are all one em wide), for the tests that check whether
/// a text fits on one line.
Future<void> loadAppFonts() async {
  for (final (family, files) in const [
    ('Manrope', ['assets/fonts/Manrope.ttf']),
    ('PlayfairDisplay', ['assets/fonts/PlayfairDisplay.ttf', 'assets/fonts/PlayfairDisplay-Italic.ttf']),
    ('JetBrainsMono', ['assets/fonts/JetBrainsMono.ttf']),
    ('Inter', ['assets/fonts/Inter.ttf']),
  ]) {
    final loader = FontLoader(family);
    for (final file in files) {
      loader.addFont(rootBundle.load(file));
    }
    await loader.load();
  }
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
