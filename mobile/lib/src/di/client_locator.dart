part of 'locator.dart';

void _initClients() {
  locator
    ..registerLazySingleton<BookingClient>(() => BookingClient(locator()))
    ..registerLazySingleton<PublicClient>(() => PublicClient(locator()))
    ..registerLazySingleton<ArrivalClient>(() => ArrivalClient(locator()))
    ..registerLazySingleton<AuthClient>(() => AuthClient(locator()))
    ..registerLazySingleton<PlanningClient>(() => PlanningClient(locator()))
    ..registerLazySingleton<DashboardClient>(() => DashboardClient(locator()))
    ..registerLazySingleton<NotificationsClient>(() => NotificationsClient(locator()))
    ..registerLazySingleton<ReturnClient>(() => ReturnClient(locator()))
    ..registerLazySingleton<ShuttleClient>(() => ShuttleClient(locator()))
    ..registerLazySingleton<PlanClient>(() => PlanClient(locator()))
    ..registerLazySingleton<OccupationClient>(() => OccupationClient(locator()))
    ..registerLazySingleton<ReservationsClient>(() => ReservationsClient(locator()))
    ..registerLazySingleton<SpotPlanningClient>(() => SpotPlanningClient(locator()))
    ..registerLazySingleton<SettingsClient>(() => SettingsClient(locator()));
}
