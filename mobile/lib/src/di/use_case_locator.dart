part of 'locator.dart';

void _initUseCaseLocator() {
  locator
    // Traveller: booking
    ..registerLazySingleton(() => LookupBookingUseCase(locator()))
    ..registerLazySingleton(() => GetBookingUseCase(locator()))
    ..registerLazySingleton(() => SaveBookingAccessUseCase(locator()))
    ..registerLazySingleton(() => SavedBookingsUseCase(locator()))
    ..registerLazySingleton(() => ForgetBookingUseCase(locator()))
    // Traveller: arrival
    ..registerLazySingleton(() => GetArrivalUseCase(locator()))
    ..registerLazySingleton(() => StartSharingUseCase(locator()))
    ..registerLazySingleton(() => SendPositionUseCase(locator()))
    ..registerLazySingleton(() => AnnounceArrivalUseCase(locator()))
    ..registerLazySingleton(() => AtMeetingPointUseCase(locator()))
    ..registerLazySingleton(() => StopSharingUseCase(locator()))
    // Staff
    ..registerLazySingleton(() => LoginUseCase(locator()))
    ..registerLazySingleton(() => RestoreSessionUseCase(locator()))
    ..registerLazySingleton(() => LogoutUseCase(locator()))
    ..registerLazySingleton(() => GetPlanningUseCase(locator()))
    ..registerLazySingleton(() => GetLiveArrivalsUseCase(locator()))
    ..registerLazySingleton(() => GetNotificationPreferencesUseCase(locator()))
    ..registerLazySingleton(() => UpdateNotificationPreferencesUseCase(locator()))
    ..registerLazySingleton(() => EnablePushUseCase(locator()));
}
