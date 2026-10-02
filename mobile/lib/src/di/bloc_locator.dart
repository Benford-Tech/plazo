part of 'locator.dart';

void _initBlocs() {
  locator
    // One per screen.
    ..registerFactory(() => BookingBloc(locator(), locator(), locator(), locator()))
    ..registerFactory(() => ArrivalBloc(locator(), locator(), locator(), locator(), locator(), locator(), locator()))
    ..registerFactory(() => ProTodayBloc(locator(), locator(), pollInterval: AppConstants.livePollInterval))
    ..registerFactory(() => ProNotificationsBloc(locator(), locator(), locator()))
    // The staff session lives as long as the app (the router's guard reads it).
    ..registerLazySingleton(() => ProAuthBloc(locator(), locator(), locator(), locator()))
    ..registerLazySingleton(() => ProAuthGuard(locator()))
    ..registerLazySingleton(() => AppRouter(proGuard: locator()));
}
