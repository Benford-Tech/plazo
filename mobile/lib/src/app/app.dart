import 'dart:async';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../core/constants/app_constants.dart';
import '../core/constants/product.g.dart';
import '../core/router/app_router.dart';
import '../di/locator.dart';
import '../features/pro_auth/presentation/bloc/pro_auth_bloc.dart';
import '../services/push_service.dart';
import '../shared/theme/theme.dart';

class App extends StatefulWidget {
  const App({super.key});

  @override
  State<App> createState() => _AppState();
}

class _AppState extends State<App> {
  final _router = locator<AppRouter>();
  StreamSubscription<Map<String, dynamic>>? _pushOpened;

  @override
  void initState() {
    super.initState();
    // A tapped staff notification opens the day's planning; a request to join the team (13/10/2026, managers) Équipe.
    _pushOpened = locator<PushService>().opened.listen((data) {
      if (data['type'] == 'arrival') unawaited(_router.navigate(const ProShellRoute(children: [ProTodayRoute()])));
      if (data['type'] == 'join_request') unawaited(_router.navigate(const ProTeamRoute()));
    });
  }

  @override
  void dispose() {
    unawaited(_pushOpened?.cancel());
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: locator<ProAuthBloc>(),
      child: MaterialApp.router(
        title: AppConstants.isPro ? Product.proName : Product.name,
        theme: appTheme(),
        routerConfig: _router.config(),
        locale: context.locale,
        supportedLocales: context.supportedLocales,
        localizationsDelegates: context.localizationDelegates,
        debugShowCheckedModeBanner: false,
        // Edge-to-edge (Android 15+, 15/10/2026): transparent system bars with dark icons by default.
        builder: (context, child) => AnnotatedRegion<SystemUiOverlayStyle>(value: appSystemUiStyle, child: child!),
      ),
    );
  }
}
