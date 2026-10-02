part of 'locator.dart';

void _initRepositoryLocator() {
  locator
    ..registerLazySingleton<BookingRepository>(() => BookingRepositoryImpl(locator()))
    ..registerLazySingleton<PublicRepository>(() => PublicRepositoryImpl(locator()))
    ..registerLazySingleton<ArrivalRepository>(() => ArrivalRepositoryImpl(locator()))
    ..registerLazySingleton<AuthRepository>(() => AuthRepositoryImpl(locator()))
    ..registerLazySingleton<PlanningRepository>(() => PlanningRepositoryImpl(locator()))
    ..registerLazySingleton<NotificationsRepository>(() => NotificationsRepositoryImpl(locator()));
}
