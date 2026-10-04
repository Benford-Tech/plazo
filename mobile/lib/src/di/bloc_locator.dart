part of 'locator.dart';

void _initBlocs() {
  locator
    // One per screen.
    ..registerFactory(() => BookingBloc(locator(), locator(), locator(), locator()))
    ..registerFactory(() => SearchBloc(locator()))
    // Shared by the search tab, "Mes réservations" and the pages that change a booking.
    ..registerLazySingleton(() => TripsBloc(locator()))
    ..registerFactory(() => ManageBookingBloc(locator(), locator()))
    // Screens opened with parameters (airport, parking, dates, reference).
    ..registerFactoryParam<ResultsBloc, StayParams, void>(
      (p, _) => ResultsBloc(locator(), airport: p.airport, arrivalAt: p.arrivalAt!, returnAt: p.returnAt!),
    )
    ..registerFactoryParam<ParkingBloc, StayParams, void>(
      (p, _) => ParkingBloc(locator(), airport: p.airport, slug: p.parking!, arrivalAt: p.arrivalAt, returnAt: p.returnAt),
    )
    ..registerFactoryParam<BookingFormBloc, StayParams, void>(
      (p, _) => BookingFormBloc(locator(), locator(), locator(), airport: p.airport, parking: p.parking!, arrivalAt: p.arrivalAt!, returnAt: p.returnAt!),
    )
    ..registerFactoryParam<PaymentBloc, String, void>(
      (reference, _) => PaymentBloc(locator(), locator(), locator(), locator(), locator(), locator(), locator(), locator(), reference: reference),
    )
    ..registerFactory(() => ArrivalBloc(locator(), locator(), locator(), locator(), locator(), locator(), locator()))
    ..registerFactory(() => ReturnBloc(locator(), locator(), locator()))
    ..registerFactory(() => MeetingRouteBloc(locator(), locator(), locator(), locator()))
    ..registerFactory(() => ShuttleBloc(locator(), locator(), locator(), locator(), locator(), locator(), locator(), locator(), pollInterval: AppConstants.livePollInterval))
    ..registerFactory(() => ProVehiclesBloc(locator(), locator(), locator(), locator()))
    ..registerFactory(() => StayShuttlesBloc(locator(), pollInterval: AppConstants.livePollInterval))
    ..registerFactory(() => ProPlanBloc(locator(), locator(), locator(), locator(), locator(), locator(), locator()))
    ..registerFactory(() => ProOccupationBloc(locator(), locator(), locator(), locator()))
    ..registerFactory(() => ProReservationsBloc(locator()))
    ..registerFactory(() => ProReservationBloc(locator(), locator()))
    ..registerFactory(() => ProImportBloc(locator()))
    ..registerFactory(() => ProSpotPlanningBloc(locator(), locator(), locator(), locator()))
    ..registerFactory(() => ProTeamBloc(locator(), locator(), locator(), locator()))
    ..registerFactory(() => ProSettingsBloc(locator(), locator(), locator(), locator(), locator(), locator(), locator(), locator()))
    ..registerFactory(() => ProTodayBloc(locator(), locator(), pollInterval: AppConstants.livePollInterval))
    ..registerFactory(() => ProNotificationsBloc(locator(), locator(), locator()))
    // The staff session lives as long as the app (the router's guard reads it).
    ..registerLazySingleton(() => ProAuthBloc(locator(), locator(), locator(), locator(), locator()))
    ..registerLazySingleton(() => ProAuthGuard(locator()))
    ..registerLazySingleton(() => AppRouter(proGuard: locator()));
}
