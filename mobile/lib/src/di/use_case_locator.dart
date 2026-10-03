part of 'locator.dart';

void _initUseCaseLocator() {
  locator
    // Traveller: booking
    ..registerLazySingleton(() => LookupBookingUseCase(locator()))
    ..registerLazySingleton(() => GetBookingUseCase(locator()))
    ..registerLazySingleton(() => SaveBookingAccessUseCase(locator()))
    ..registerLazySingleton(() => SavedBookingsUseCase(locator()))
    ..registerLazySingleton(() => ForgetBookingUseCase(locator()))
    ..registerLazySingleton(() => CreateBookingUseCase(locator()))
    ..registerLazySingleton(() => UpdateFlightUseCase(locator()))
    ..registerLazySingleton(() => CancelBookingUseCase(locator()))
    ..registerLazySingleton(() => CreatePaymentIntentUseCase(locator()))
    ..registerLazySingleton(() => CheckoutUseCase(locator()))
    ..registerLazySingleton(() => ReleaseHoldUseCase(locator()))
    ..registerLazySingleton(() => LoadSavedBookingsUseCase(locator()))
    // Traveller: search
    ..registerLazySingleton(() => GetAirportsUseCase(locator()))
    ..registerLazySingleton(() => SearchParkingsUseCase(locator()))
    ..registerLazySingleton(() => GetParkingUseCase(locator()))
    ..registerLazySingleton(() => GetPaymentsConfigUseCase(locator()))
    // Traveller: arrival
    ..registerLazySingleton(() => GetArrivalUseCase(locator()))
    ..registerLazySingleton(() => StartSharingUseCase(locator()))
    ..registerLazySingleton(() => SendPositionUseCase(locator()))
    ..registerLazySingleton(() => AnnounceArrivalUseCase(locator()))
    ..registerLazySingleton(() => AtMeetingPointUseCase(locator()))
    ..registerLazySingleton(() => StopSharingUseCase(locator()))
    // Traveller: the return day
    ..registerLazySingleton(() => GetReturnUseCase(locator()))
    ..registerLazySingleton(() => DeclareLandedUseCase(locator()))
    ..registerLazySingleton(() => GetWalkingRouteUseCase(locator()))
    ..registerLazySingleton(() => GetShuttleStatusUseCase(locator()))
    // Staff: driver mode
    ..registerLazySingleton(() => GetPickupsUseCase(locator()))
    ..registerLazySingleton(() => GetVehiclesUseCase(locator()))
    ..registerLazySingleton(() => GetCurrentTripUseCase(locator()))
    ..registerLazySingleton(() => StartTripUseCase(locator()))
    ..registerLazySingleton(() => SendTripPositionUseCase(locator()))
    ..registerLazySingleton(() => EndTripUseCase(locator()))
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
