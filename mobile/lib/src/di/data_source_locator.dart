part of 'locator.dart';

void _initDataSource() {
  locator
    ..registerLazySingleton<BookingDataSource>(() => BookingDataSourceImpl(locator(), locator()))
    ..registerLazySingleton<PublicDataSource>(() => PublicDataSourceImpl(locator()))
    ..registerLazySingleton<ArrivalDataSource>(() => ArrivalDataSourceImpl(locator(), locator()))
    ..registerLazySingleton<AuthDataSource>(() => AuthDataSourceImpl(locator(), locator()))
    ..registerLazySingleton<PlanningDataSource>(() => PlanningDataSourceImpl(locator()))
    ..registerLazySingleton<DashboardDataSource>(() => DashboardDataSourceImpl(locator()))
    ..registerLazySingleton<NotificationsDataSource>(() => NotificationsDataSourceImpl(locator(), locator()))
    ..registerLazySingleton<ReturnDataSource>(() => ReturnDataSourceImpl(locator(), locator(), locator()))
    ..registerLazySingleton<ShuttleDataSource>(() => ShuttleDataSourceImpl(locator()))
    ..registerLazySingleton<PlanDataSource>(() => PlanDataSourceImpl(locator()))
    ..registerLazySingleton<OccupationDataSource>(() => OccupationDataSourceImpl(locator()))
    ..registerLazySingleton<ReservationsDataSource>(() => ReservationsDataSourceImpl(locator()))
    ..registerLazySingleton<SpotPlanningDataSource>(() => SpotPlanningDataSourceImpl(locator()))
    ..registerLazySingleton<SettingsDataSource>(() => SettingsDataSourceImpl(locator()));
}
