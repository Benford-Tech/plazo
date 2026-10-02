part of 'locator.dart';

void _initDataSource() {
  locator
    ..registerLazySingleton<BookingDataSource>(() => BookingDataSourceImpl(locator(), locator()))
    ..registerLazySingleton<ArrivalDataSource>(() => ArrivalDataSourceImpl(locator(), locator()))
    ..registerLazySingleton<AuthDataSource>(() => AuthDataSourceImpl(locator(), locator()))
    ..registerLazySingleton<PlanningDataSource>(() => PlanningDataSourceImpl(locator()))
    ..registerLazySingleton<NotificationsDataSource>(() => NotificationsDataSourceImpl(locator(), locator()));
}
