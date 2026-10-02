part of 'locator.dart';

void _initClients() {
  locator
    ..registerLazySingleton<BookingClient>(() => BookingClient(locator()))
    ..registerLazySingleton<PublicClient>(() => PublicClient(locator()))
    ..registerLazySingleton<ArrivalClient>(() => ArrivalClient(locator()))
    ..registerLazySingleton<AuthClient>(() => AuthClient(locator()))
    ..registerLazySingleton<PlanningClient>(() => PlanningClient(locator()))
    ..registerLazySingleton<NotificationsClient>(() => NotificationsClient(locator()));
}
