import 'dart:async';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

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
    // A tapped staff notification opens the day's planning.
    _pushOpened = locator<PushService>().opened.listen((data) {
      if (data['type'] == 'arrival') unawaited(_router.navigate(const ProTodayRoute()));
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
        title: Product.name,
        theme: appTheme(),
        routerConfig: _router.config(),
        locale: context.locale,
        supportedLocales: context.supportedLocales,
        localizationsDelegates: context.localizationDelegates,
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}
