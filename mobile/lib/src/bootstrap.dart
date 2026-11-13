import 'dart:async';
import 'dart:developer';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_web_plugins/url_strategy.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'di/locator.dart';
import 'features/pro_auth/presentation/bloc/pro_auth_bloc.dart';
import 'services/push_service.dart';

class AppBlocObserver extends BlocObserver {
  const AppBlocObserver();

  // Only the type of the error: states may hold a traveller's data or position.
  @override
  void onError(BlocBase<dynamic> bloc, Object error, StackTrace stackTrace) {
    log('onError(${bloc.runtimeType}, ${error.runtimeType})');
    super.onError(bloc, error, stackTrace);
  }
}

/// The app's languages; their texts are assets/l10n/<code>.json (French is the reference).
const supportedAppLocales = [
  Locale('fr', 'FR'),
  Locale('en', 'GB'),
  Locale('de', 'DE'),
  Locale('es', 'ES'),
  Locale('pt', 'PT'),
  Locale('pl', 'PL'),
  Locale('ro', 'RO'),
  Locale('ru', 'RU'),
  Locale('uk', 'UA'),
];

Future<void> bootstrap(FutureOr<Widget> Function() builder) async {
  // Web: real paths (/ma-reservation/REF?cle=...), the same as the site's links, not #/ ones.
  usePathUrlStrategy();
  WidgetsFlutterBinding.ensureInitialized();
  // Edge-to-edge on Android 10+ (MainActivity.kt turns it on natively): without this mode, Flutter puts its default
  // window flags back on every resume and the app stops drawing behind the navigation bar. Android only: the web has no
  // such method (MissingPluginException, which main.dart's zone would take for a startup error).
  if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
    unawaited(SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge));
  }
  FlutterError.onError = (details) => log(details.exceptionAsString(), stackTrace: details.stack);
  Bloc.observer = const AppBlocObserver();

  await EasyLocalization.ensureInitialized();
  // Every language's month and day names: the app follows the phone's language (13/11/2026).
  await initializeDateFormatting();
  await initLocator();

  final push = locator<PushService>();
  if (push is OneSignalPushService) push.initialize();
  locator<ProAuthBloc>().add(const ProAuthRestoreRequested());

  runApp(
    EasyLocalization(
      // The phone's language when the app has it (13/11/2026, « traduit en anglais, allemand, espagnol, portugais et
      // quelques grandes langues des pays de l'Est »), French otherwise. No startLocale: easy_localization picks the
      // device's, matched on the language alone when the country differs (de-AT reads de-DE).
      supportedLocales: supportedAppLocales,
      fallbackLocale: const Locale('fr', 'FR'),
      useOnlyLangCode: false,
      path: 'assets/l10n',
      child: await builder(),
    ),
  );
}
